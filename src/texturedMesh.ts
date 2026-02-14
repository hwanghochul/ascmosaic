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
        const group = new THREE.Group();
        group.add(gltf.scene);
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
      return group;
    }).catch(() => {
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
    color: 0xffffff,
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
