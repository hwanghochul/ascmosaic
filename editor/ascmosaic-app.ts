/**
 * AscMosaic 스니펫용 앱 진입점.
 * window.ASC_MOSAIC_CONFIG를 읽어 지구본 + 모자이크 필터를 초기화합니다.
 */
import { AscMosaic } from '../src/index';

declare global {
  interface Window {
    ASC_MOSAIC_CONFIG?: {
      mosaicSize?: number;
      mosaicCellTextureUrl?: string;
      cellCount?: number;
      backgroundColor?: number;
      noiseIntensity?: number;
      noiseFPS?: number;
    };
    /** Blob 미리보기 등에서 텍스처를 같은 오리진으로 로드할 때 사용 (예: 'https://localhost:5173') */
    ASC_MOSAIC_BASE_URL?: string;
  }
}

/** 상대 경로(/)면 BASE_URL을 붙여 절대 URL로 만듦 */
function resolveTextureUrl(url: string): string {
  const base = window.ASC_MOSAIC_BASE_URL;
  if (base && url.startsWith('/')) return base + url;
  return url;
}

(async () => {
  const config = window.ASC_MOSAIC_CONFIG ?? {};

  const container = document.getElementById('canvas-container');
  if (!container) throw new Error('canvas-container element not found');

  const mosaic = new AscMosaic(container);

  mosaic.addLights();
  mosaic.addEarth({
    radius: 2,
    widthSegments: 64,
    heightSegments: 32,
    textureUrl: resolveTextureUrl('/textures/earth.jpg'),
  });
  mosaic.setupOrbitControls({
    minDistance: 3,
    maxDistance: 10,
    rotateSpeed: 1.0,
    zoomSpeed: 0.1,
  });

  const mosaicCellTextureUrl = resolveTextureUrl(
    config.mosaicCellTextureUrl ?? '/textures/mosaic_cell.png'
  );
  await mosaic.enableAsciiMosaicFilter({
    mosaicSize: config.mosaicSize ?? 10,
    mosaicCellTextureUrl,
    cellCount: config.cellCount ?? 6,
    backgroundColor: config.backgroundColor ?? 0xffffff,
    noiseIntensity: config.noiseIntensity ?? 0,
    noiseFPS: config.noiseFPS ?? 10,
  });

  function animate() {
    requestAnimationFrame(animate);
    mosaic.renderOnce();
  }
  animate();
})();
