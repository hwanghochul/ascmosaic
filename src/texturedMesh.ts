import * as THREE from 'three';

export type TexturedMeshShape = 'sphere' | 'cube' | 'plane';

/**
 * 텍스처 메시 생성 옵션
 */
export interface TexturedMeshOptions {
  /** 도형 종류 */
  shape?: TexturedMeshShape;
  /** 텍스처 URL */
  textureUrl?: string;
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

/**
 * 텍스처가 입혀진 메시를 생성합니다 (구/큐브/평면).
 */
export function createTexturedMesh(options: TexturedMeshOptions = {}): THREE.Mesh {
  const shape = options.shape ?? 'sphere';
  const textureUrl = options.textureUrl ?? DEFAULT_TEXTURE_URL;
  const radius = options.radius ?? 2;
  const widthSegments = options.widthSegments ?? 64;
  const heightSegments = options.heightSegments ?? 32;
  const size = options.size ?? 4;
  const width = options.width ?? 4;
  const height = options.height ?? 4;

  let geometry: THREE.BufferGeometry;
  switch (shape) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
      break;
    case 'cube':
      geometry = new THREE.BoxGeometry(size, size, size);
      break;
    case 'plane':
      geometry = new THREE.PlaneGeometry(width, height);
      break;
    default:
      geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  }

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
      (error) => {
        console.warn('텍스처 로딩 실패:', error);
        textureLoadFailed = true;
      }
    );
  } catch (error) {
    console.warn('텍스처 로더 오류:', error);
    textureLoadFailed = true;
  }

  const materialOptions: THREE.MeshStandardMaterialParameters = {
    roughness: 0.8,
    metalness: 0.2,
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

  return mesh;
}
