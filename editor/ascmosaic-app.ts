/**
 * AscMosaic 스니펫용 앱 진입점.
 * .ascmosaic 컨테이너를 찾아 data-ascmosaic-config 별로 지구본 + 모자이크 필터를 초기화합니다.
 * 한 HTML에 여러 div.ascmosaic를 넣고 스크립트는 한 번만 포함하면 됩니다.
 */
import { AscMosaic, type TexturedMeshOptions } from '../src/index';

declare global {
  interface Window {
    ASC_MOSAIC_CONFIG?: {
      shape?: 'sphere' | 'cube' | 'plane' | 'glb';
      radius?: number;
      size?: number;
      width?: number;
      height?: number;
      modelUrl?: string;
      scale?: number;
      mosaicSize?: number;
      mosaicCellTextureUrl?: string;
      textureUrl?: string;
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

interface InstanceConfig {
  shape?: 'sphere' | 'cube' | 'plane' | 'glb';
  radius?: number;
  size?: number;
  width?: number;
  height?: number;
  modelUrl?: string;
  scale?: number;
  mosaicSize?: number;
  mosaicCellTextureUrl?: string;
  textureUrl?: string;
  cellCount?: number;
  backgroundColor?: number;
  noiseIntensity?: number;
  noiseFPS?: number;
}

async function initContainer(container: HTMLElement): Promise<AscMosaic | null> {
  if (container.getAttribute('data-ascmosaic-initialized') === 'true') return null;

  let config: InstanceConfig = {};
  const raw = container.getAttribute('data-ascmosaic-config');
  if (raw) {
    try {
      config = JSON.parse(raw) as InstanceConfig;
    } catch {
      config = {};
    }
  }
  if (!raw && window.ASC_MOSAIC_CONFIG) config = window.ASC_MOSAIC_CONFIG;

  const mosaic = new AscMosaic(container);
  mosaic.addLights();

  const shape = config.shape ?? 'sphere';
  const scale = config.scale ?? 1;
  const earthOptions: TexturedMeshOptions = { shape, scale };
  if (shape === 'glb') {
    if (config.modelUrl) earthOptions.modelUrl = resolveTextureUrl(config.modelUrl);
  } else {
    earthOptions.textureUrl = resolveTextureUrl(config.textureUrl ?? '/resource/earth.jpg');
    if (shape === 'sphere') {
      earthOptions.radius = config.radius ?? 2;
      earthOptions.widthSegments = 64;
      earthOptions.heightSegments = 32;
    } else if (shape === 'cube') {
      earthOptions.size = config.size ?? 4;
    } else {
      earthOptions.width = config.width ?? 4;
      earthOptions.height = config.height ?? 4;
    }
  }
  await mosaic.addModel(earthOptions);

  mosaic.setupOrbitControls({
    minDistance: 3,
    maxDistance: 10,
    rotateSpeed: 1.0,
    zoomSpeed: 0.1,
  });

  const mosaicCellTextureUrl = resolveTextureUrl(
    config.mosaicCellTextureUrl ?? '/resource/mosaic_cell.png'
  );
  await mosaic.enableAsciiMosaicFilter({
    mosaicSize: config.mosaicSize ?? 10,
    mosaicCellTextureUrl,
    cellCount: config.cellCount ?? 6,
    backgroundColor: config.backgroundColor ?? 0xffffff,
    noiseIntensity: config.noiseIntensity ?? 0,
    noiseFPS: config.noiseFPS ?? 10,
  });

  container.setAttribute('data-ascmosaic-initialized', 'true');
  return mosaic;
}

(async () => {
  const containers = document.querySelectorAll<HTMLElement>('.ascmosaic');
  const instances: AscMosaic[] = [];

  for (const el of containers) {
    const mosaic = await initContainer(el);
    if (mosaic) instances.push(mosaic);
  }

  if (instances.length === 0) return;

  function animate() {
    requestAnimationFrame(animate);
    for (const m of instances) m.renderOnce();
  }
  animate();
})();
