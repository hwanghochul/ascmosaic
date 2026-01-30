import * as THREE from 'three';

/**
 * 지구본 생성 옵션
 */
export interface EarthOptions {
  /** 반지름 */
  radius?: number;
  /** 텍스처 URL (지정하지 않으면 로컬 이미지 사용) */
  textureUrl?: string;
  /** 세그먼트 수 (widthSegments) */
  widthSegments?: number;
  /** 세그먼트 수 (heightSegments) */
  heightSegments?: number;
}

// 기본 로컬 지구 텍스처 경로 (public/textures/earth.jpg)
const DEFAULT_EARTH_TEXTURE_URL = '/textures/earth.jpg';

/**
 * 지구본을 생성합니다.
 */
export function createEarth(options: EarthOptions = {}): THREE.Mesh {
  const radius = options.radius ?? 2;
  const widthSegments = options.widthSegments ?? 64;
  const heightSegments = options.heightSegments ?? 32;
  const textureUrl = options.textureUrl ?? DEFAULT_EARTH_TEXTURE_URL;

  // 지오메트리 생성
  const geometry = new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments
  );

  // 텍스처 로더
  const textureLoader = new THREE.TextureLoader();

  // 텍스처 로딩
  let texture: THREE.Texture | null = null;
  let textureLoadFailed = false;

  try {
    texture = textureLoader.load(
      textureUrl,
      // 로딩 성공
      () => {
        if (texture) {
          texture.needsUpdate = true;
        }
      },
      // 진행 중
      undefined,
      // 로딩 실패
      (error) => {
        console.warn('지구 텍스처 로딩 실패:', error);
        console.warn('텍스처 URL:', textureUrl);
        textureLoadFailed = true;
      }
    );
  } catch (error) {
    console.warn('텍스처 로더 오류:', error);
    textureLoadFailed = true;
  }

  // 머티리얼 생성 (조명 필요)
  const materialOptions: THREE.MeshStandardMaterialParameters = {
    roughness: 0.8,
    metalness: 0.2,
    color: 0xDDDDDD,
  };

  // 텍스처가 성공적으로 로드된 경우에만 추가
  if (texture && !textureLoadFailed) {
    materialOptions.map = texture;
  } else {
    // 텍스처 로딩 실패 시 기본 색상 사용
    materialOptions.color = 0x4a90e2; // 지구색과 유사한 파란색
    console.warn('텍스처를 사용할 수 없어 기본 색상으로 표시합니다.');
  }

  const material = new THREE.MeshBasicMaterial(materialOptions);

  // 메시 생성
  const earth = new THREE.Mesh(geometry, material);
  earth.name = 'Earth';

  return earth;
}
