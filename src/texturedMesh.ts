import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type TexturedMeshShape = 'sphere' | 'cube' | 'plane' | 'glb';

/**
 * 텍스처 메시 생성 옵션
 */
export interface TexturedMeshOptions {
  /** 도형 종류 */
  shape?: TexturedMeshShape;
  /** 텍스처 URL (shape가 glb가 아닐 때) */
  textureUrl?: string;
  /** GLB 모델 URL (shape: glb) */
  modelUrl?: string;
  /** 크기 배율 (모든 도형) */
  scale?: number;
  /** 구 반지름 (shape: sphere) */
  radius?: number;
  /** 구 세그먼트 (shape: sphere) */
  widthSegments?: number;
  heightSegments?: number;
  /** 큐브 한 변 길이 (shape: cube) */
  size?: number;
  /** 평면 가로 (shape: plane) */
  width?: number;
  /** 평면 세로 (shape: plane) */
  height?: number;
}

const DEFAULT_TEXTURE_URL = '/resource/earth.jpg';

function buildGeometry(shape: Exclude<TexturedMeshShape, 'glb'>, options: TexturedMeshOptions): THREE.BufferGeometry {
  const radius = options.radius ?? 2;
  const widthSegments = options.widthSegments ?? 64;
  const heightSegments = options.heightSegments ?? 32;
  const size = options.size ?? 4;
  const width = options.width ?? 4;
  const height = options.height ?? 4;

  switch (shape) {
    case 'sphere':
      return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    case 'cube':
      return new THREE.BoxGeometry(size, size, size);
    case 'plane':
      return new THREE.PlaneGeometry(width, height);
    default:
      return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  }
}

function loadGlbModel(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        console.log('GLB 로드 성공:', gltf);
        console.log('Scene children:', gltf.scene.children.length);
        console.log('Scene type:', gltf.scene.type);
        
        const group = new THREE.Group();
        group.add(gltf.scene);
        
        // 모든 메시의 material을 MeshStandardMaterial로 변경하여 조명 효과 적용
        let meshCount = 0;
        let totalObjects = 0;
        gltf.scene.traverse((obj) => {
          totalObjects++;
          if (obj instanceof THREE.Mesh) {
            meshCount++;
            console.log('Mesh found:', obj.name || 'unnamed', 'material:', obj.material ? 'yes' : 'no');
            
            if (obj.material) {
              const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
              const newMaterials = materials.map((oldMaterial) => {
                const materialParams: THREE.MeshStandardMaterialParameters = {
                  color: 0xffffff,
                  roughness: 0.7,
                  metalness: 0.1,
                };
                
                if (oldMaterial instanceof THREE.Material) {
                  // 모든 Material 타입에서 map과 color 추출 시도
                  if ('map' in oldMaterial && oldMaterial.map) {
                    materialParams.map = oldMaterial.map as THREE.Texture;
                  }
                  if ('color' in oldMaterial && oldMaterial.color) {
                    materialParams.color = (oldMaterial.color as THREE.Color).getHex();
                  }
                }
                
                return new THREE.MeshStandardMaterial(materialParams);
              });
              obj.material = Array.isArray(obj.material) ? newMaterials : newMaterials[0];
            } else {
              // material이 없으면 기본 material 추가
              obj.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
            }
          }
        });
        
        console.log('Total objects traversed:', totalObjects, 'Meshes:', meshCount);
        
        // 메시 개수 저장 (디버깅용)
        (group as any)._meshCount = meshCount;
        resolve(group);
      },
      undefined,
      (error) => reject(error)
    );
  });
}

/**
 * 텍스처가 입혀진 메시 또는 GLB 모델을 생성합니다 (구/큐브/평면/glb).
 * glb인 경우 비동기로 로드되므로 Promise를 반환합니다.
 */
export function createTexturedMesh(options: TexturedMeshOptions = {}): Promise<THREE.Object3D> {
  const shape = options.shape ?? 'sphere';
  const scale = options.scale ?? 1;

  if (shape === 'glb') {
    const modelUrl = options.modelUrl ?? '';
    if (!modelUrl) {
      const fallback = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x888888 })
      );
      fallback.scale.setScalar(scale);
      return Promise.resolve(fallback);
    }
    return loadGlbModel(modelUrl).then((group) => {
      group.scale.setScalar(scale);
      group.name = 'TexturedMesh';
      
      // bounding box 계산하여 모델이 보이도록 확인
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const meshCount = (group as any)._meshCount || 0;
      console.log('GLB 모델 로드 완료:', {
        size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
        center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
        children: group.children.length,
        meshes: meshCount
      });
      
      return group;
    }).catch((error) => {
      console.error('GLB 모델 로드 실패:', error, 'URL:', modelUrl);
      // 폴백: 기본 메시 반환
      const fallback = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      fallback.scale.setScalar(scale);
      return fallback;
    });
  }

  const textureUrl = options.textureUrl ?? DEFAULT_TEXTURE_URL;
  const geometry = buildGeometry(shape, options);

  const textureLoader = new THREE.TextureLoader();
  let texture: THREE.Texture | null = null;
  let textureLoadFailed = false;

  try {
    texture = textureLoader.load(
      textureUrl,
      () => {
        if (texture) texture.needsUpdate = true;
      },
      undefined,
      () => {
        textureLoadFailed = true;
      }
    );
  } catch {
    textureLoadFailed = true;
  }

  const materialOptions: THREE.MeshBasicMaterialParameters = {
    color: 0xdddddd,
  };
  if (texture && !textureLoadFailed) {
    materialOptions.map = texture;
  } else {
    materialOptions.color = 0x4a90e2;
  }

  const material = new THREE.MeshBasicMaterial(materialOptions);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'TexturedMesh';
  mesh.scale.setScalar(scale);

  return Promise.resolve(mesh);
}
