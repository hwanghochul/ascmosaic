import * as THREE from 'three';

/**
 * ASCII 아틀라스 생성 옵션
 */
export interface AsciiAtlasOptions {
  /** ASCII 문자 세트 (밝기 순서: 어두움 -> 밝음) */
  charset?: string;
  /** 폰트 크기 (픽셀) */
  fontSize?: number;
  /** 폰트 패밀리 */
  fontFamily?: string;
  /** 문자 너비 (픽셀) */
  charWidth?: number;
  /** 문자 높이 (픽셀) */
  charHeight?: number;
}

/**
 * ASCII 아틀라스 결과
 */
export interface AsciiAtlasResult {
  /** 생성된 텍스처 */
  texture: THREE.Texture;
  /** 문자 개수 */
  charCount: number;
  /** 각 문자의 UV 좌표 (uMin, uMax) */
  charUVs: Array<[number, number]>;
}

// 기본 ASCII 문자 세트 (밝기 순서: 어두움 -> 밝음)
const DEFAULT_CHARSET = ' .,:;+=xX$&@#';

/**
 * ASCII 아틀라스 텍스처를 생성합니다.
 * Canvas 2D API를 사용하여 문자들을 한 줄로 배치한 이미지를 생성합니다.
 */
export function createAsciiAtlas(
  options: AsciiAtlasOptions = {}
): Promise<AsciiAtlasResult> {
  const charset = options.charset ?? DEFAULT_CHARSET;
  const fontSize = options.fontSize ?? 32;
  const fontFamily = options.fontFamily ?? 'monospace';
  const charWidth = options.charWidth ?? fontSize;
  const charHeight = options.charHeight ?? fontSize;

  return new Promise((resolve, reject) => {
    try {
      // Canvas 생성
      const canvas = document.createElement('canvas');
      const charCount = charset.length;
      const atlasWidth = charWidth * charCount;
      const atlasHeight = charHeight;

      canvas.width = atlasWidth;
      canvas.height = atlasHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context를 생성할 수 없습니다.'));
        return;
      }

      // 배경을 흰색으로 설정
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, atlasWidth, atlasHeight);

      // 텍스트 스타일 설정 (검정색 글자)
      ctx.fillStyle = '#000000';
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 각 문자를 한 줄로 배치
      const charUVs: Array<[number, number]> = [];
      for (let i = 0; i < charCount; i++) {
        const char = charset[i];
        const x = i * charWidth + charWidth / 2;
        const y = charHeight / 2;

        // 문자 그리기
        ctx.fillText(char, x, y);

        // UV 좌표 계산 (정규화된 좌표)
        const uMin = i / charCount;
        const uMax = (i + 1) / charCount;
        charUVs.push([uMin, uMax]);
      }

      // Canvas를 이미지로 변환하여 텍스처 생성
      const image = new Image();
      image.onload = () => {
        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        resolve({
          texture,
          charCount,
          charUVs,
        });
      };

      image.onerror = () => {
        reject(new Error('이미지 로드에 실패했습니다.'));
      };

      image.src = canvas.toDataURL('image/png');
    } catch (error) {
      reject(error);
    }
  });
}
