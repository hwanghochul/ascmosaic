import { AscMosaic } from '../src/index';

// DOM 요소 가져오기
const canvasContainer = document.getElementById('canvas-container')!;
const asciiToggleBtn = document.getElementById('ascii-toggle-btn')!;
const pixelSizeContainer = document.getElementById('pixel-size-container')!;
const pixelSizeSlider = document.getElementById('pixel-size-slider')! as HTMLInputElement;
const pixelSizeValue = document.getElementById('pixel-size-value')!;
const noiseIntensityContainer = document.getElementById('noise-intensity-container')!;
const noiseIntensitySlider = document.getElementById('noise-intensity-slider')! as HTMLInputElement;
const noiseIntensityValue = document.getElementById('noise-intensity-value')!;
const noiseFPSContainer = document.getElementById('noise-fps-container')!;
const noiseFPSSlider = document.getElementById('noise-fps-slider')! as HTMLInputElement;
const noiseFPSValue = document.getElementById('noise-fps-value')!;
const cellSelectContainer = document.getElementById('cell-select-container')!;
const cellSelect = document.getElementById('cell-select')! as HTMLSelectElement;
const shapeSelect = document.getElementById('shape-select')! as HTMLSelectElement;
const shapeSphereParams = document.getElementById('shape-sphere-params')!;
const shapeCubeParams = document.getElementById('shape-cube-params')!;
const shapePlaneParams = document.getElementById('shape-plane-params')!;
const sphereRadiusSlider = document.getElementById('sphere-radius')! as HTMLInputElement;
const sphereRadiusValue = document.getElementById('sphere-radius-value')!;
const cubeSizeSlider = document.getElementById('cube-size')! as HTMLInputElement;
const cubeSizeValue = document.getElementById('cube-size-value')!;
const planeWidthSlider = document.getElementById('plane-width')! as HTMLInputElement;
const planeWidthValue = document.getElementById('plane-width-value')!;
const planeHeightSlider = document.getElementById('plane-height')! as HTMLInputElement;
const planeHeightValue = document.getElementById('plane-height-value')!;
const textureSelectContainer = document.getElementById('texture-select-container')!;
const textureSelect = document.getElementById('texture-select')! as HTMLSelectElement;
const cellCountContainer = document.getElementById('cell-count-container')!;
const cellCountSlider = document.getElementById('cell-count-slider')! as HTMLInputElement;
const cellCountValue = document.getElementById('cell-count-value')!;
const generateHtmlBtn = document.getElementById('generate-html-btn')!;
const previewHtmlBtn = document.getElementById('preview-html-btn')!;
const generatedHtmlCode = document.getElementById('generated-html-code')! as HTMLTextAreaElement;

// AscMosaic 인스턴스 생성
const mosaic = new AscMosaic(canvasContainer);

// 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);
  mosaic.renderOnce();
}

// 리소스 목록 (resource_list.json에서 로드)
interface ResourceList {
  cells: string[];
  textures: string[];
}

type ShapeType = 'sphere' | 'cube' | 'plane';

// 현재 설정값 저장
let currentMosaicSize = 10;
let currentNoiseIntensity = 0.0;
let currentNoiseFPS = 10;
let currentCellCount = 6;
let currentCellUrl = '/resource/mosaic_cell.png';
let currentEarthTextureUrl = '/resource/earth.jpg';
let currentShape: ShapeType = 'sphere';
let currentRadius = 2;
let currentCubeSize = 4;
let currentPlaneWidth = 4;
let currentPlaneHeight = 4;

function getEarthOptions() {
  const base: Record<string, unknown> = {
    shape: currentShape,
    textureUrl: currentEarthTextureUrl,
  };
  if (currentShape === 'sphere') {
    base.radius = currentRadius;
    base.widthSegments = 64;
    base.heightSegments = 32;
  } else if (currentShape === 'cube') {
    base.size = currentCubeSize;
  } else {
    base.width = currentPlaneWidth;
    base.height = currentPlaneHeight;
  }
  return base;
}

function applyEarth() {
  mosaic.addEarth(getEarthOptions());
}

function showShapeParams(shape: ShapeType) {
  shapeSphereParams.style.display = shape === 'sphere' ? 'flex' : 'none';
  shapeCubeParams.style.display = shape === 'cube' ? 'flex' : 'none';
  shapePlaneParams.style.display = shape === 'plane' ? 'flex' : 'none';
}

// 초기 도형 서브 UI 표시
showShapeParams(currentShape);

// ASCII 필터 토글 버튼
asciiToggleBtn.addEventListener('click', async () => {
  try {
    await mosaic.toggleAsciiMosaicFilter({
      mosaicSize: currentMosaicSize,
      mosaicCellTextureUrl: currentCellUrl,
      cellCount: currentCellCount,
      backgroundColor: 0xffffff,
      noiseIntensity: currentNoiseIntensity,
      noiseFPS: currentNoiseFPS,
    });

    if (mosaic.isAsciiMosaicFilterEnabled()) {
      asciiToggleBtn.textContent = 'ASCII 필터 끄기';
      asciiToggleBtn.style.background = '#28a745';
      pixelSizeContainer.style.display = 'flex';
      noiseIntensityContainer.style.display = 'flex';
      noiseFPSContainer.style.display = 'flex';
      cellCountContainer.style.display = 'flex';
      cellSelectContainer.style.display = 'flex';
    } else {
      asciiToggleBtn.textContent = 'ASCII 필터 토글';
      asciiToggleBtn.style.background = '#667eea';
      pixelSizeContainer.style.display = 'none';
      noiseIntensityContainer.style.display = 'none';
      noiseFPSContainer.style.display = 'none';
      cellCountContainer.style.display = 'none';
      cellSelectContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('ASCII 필터 토글 오류:', error);
  }
});

// 픽셀 사이즈 슬라이더 이벤트
pixelSizeSlider.addEventListener('input', (e) => {
  const size = parseInt((e.target as HTMLInputElement).value);
  currentMosaicSize = size;
  pixelSizeValue.textContent = size.toString();
  
  // 필터가 활성화되어 있으면 즉시 적용
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setMosaicSize(size);
  }
});

// 노이즈 강도 슬라이더 이벤트
noiseIntensitySlider.addEventListener('input', (e) => {
  const value = parseInt((e.target as HTMLInputElement).value);
  const intensity = value / 100; // 0-100을 0.0-1.0으로 변환
  currentNoiseIntensity = intensity;
  noiseIntensityValue.textContent = intensity.toFixed(2);
  
  // 필터가 활성화되어 있으면 즉시 적용
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setNoiseIntensity(intensity);
  }
});

// 노이즈 FPS 슬라이더 이벤트
noiseFPSSlider.addEventListener('input', (e) => {
  const fps = parseInt((e.target as HTMLInputElement).value);
  currentNoiseFPS = fps;
  noiseFPSValue.textContent = fps.toString();
  
  // 필터가 활성화되어 있으면 즉시 적용
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setNoiseFPS(fps);
  }
});

// 셀 개수 슬라이더 이벤트
cellCountSlider.addEventListener('input', async (e) => {
  const count = parseInt((e.target as HTMLInputElement).value);
  currentCellCount = count;
  cellCountValue.textContent = count.toString();

  // 셀 개수는 런타임 변경이 불가하므로 필터를 재생성
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    await mosaic.disableAsciiMosaicFilter();
    await mosaic.enableAsciiMosaicFilter({
      mosaicSize: currentMosaicSize,
      mosaicCellTextureUrl: currentCellUrl,
      cellCount: currentCellCount,
      backgroundColor: 0xffffff,
      noiseIntensity: currentNoiseIntensity,
      noiseFPS: currentNoiseFPS,
    });
  }
});

// 셀 선택 이벤트
cellSelect.addEventListener('change', async () => {
  const value = cellSelect.value;
  if (!value) return;
  currentCellUrl = value;
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    await mosaic.disableAsciiMosaicFilter();
    await mosaic.enableAsciiMosaicFilter({
      mosaicSize: currentMosaicSize,
      mosaicCellTextureUrl: currentCellUrl,
      cellCount: currentCellCount,
      backgroundColor: 0xffffff,
      noiseIntensity: currentNoiseIntensity,
      noiseFPS: currentNoiseFPS,
    });
  }
});

// 도형 선택 이벤트
shapeSelect.addEventListener('change', () => {
  currentShape = shapeSelect.value as ShapeType;
  showShapeParams(currentShape);
  applyEarth();
});

// 구 반지름
sphereRadiusSlider.addEventListener('input', () => {
  currentRadius = parseFloat(sphereRadiusSlider.value);
  sphereRadiusValue.textContent = currentRadius.toFixed(1);
  applyEarth();
});

// 큐브 크기
cubeSizeSlider.addEventListener('input', () => {
  currentCubeSize = parseFloat(cubeSizeSlider.value);
  cubeSizeValue.textContent = currentCubeSize.toFixed(1);
  applyEarth();
});

// 평면 가로/세로
planeWidthSlider.addEventListener('input', () => {
  currentPlaneWidth = parseFloat(planeWidthSlider.value);
  planeWidthValue.textContent = currentPlaneWidth.toFixed(1);
  applyEarth();
});
planeHeightSlider.addEventListener('input', () => {
  currentPlaneHeight = parseFloat(planeHeightSlider.value);
  planeHeightValue.textContent = currentPlaneHeight.toFixed(1);
  applyEarth();
});

// 텍스처 선택 이벤트
textureSelect.addEventListener('change', () => {
  const value = textureSelect.value;
  if (!value) return;
  currentEarthTextureUrl = value;
  applyEarth();
});

// 조명 추가 (지구본을 위해 필요)
mosaic.addLights();

// OrbitControls 설정 (마우스로 지구본 회전 및 줌)
mosaic.setupOrbitControls({
  minDistance: 3,
  maxDistance: 10,
  rotateSpeed: 1.0,
  zoomSpeed: 0.1,
});

// resource_list.json 로드 후 콤보박스 채우기 및 지구본 추가
function loadResourceList(): Promise<void> {
  return fetch('/resource/resource_list.json')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('resource_list.json 로드 실패'))))
    .then((list: ResourceList) => {
      const base = '/resource/';
      cellSelect.innerHTML = '';
      (list.cells ?? []).forEach((filename) => {
        const opt = document.createElement('option');
        opt.value = base + filename;
        opt.textContent = filename;
        cellSelect.appendChild(opt);
      });
      textureSelect.innerHTML = '';
      (list.textures ?? []).forEach((filename) => {
        const opt = document.createElement('option');
        opt.value = base + filename;
        opt.textContent = filename;
        textureSelect.appendChild(opt);
      });
      if (list.cells?.length) currentCellUrl = base + list.cells[0];
      if (list.textures?.length) currentEarthTextureUrl = base + list.textures[0];
      showShapeParams(currentShape);
      applyEarth();
    })
    .catch((err) => {
      console.warn('resource_list.json 로드 실패, 기본값 사용:', err);
      showShapeParams(currentShape);
      applyEarth();
    });
}

// HTML 스니펫 생성 (컨테이너별 data 설정, 로직은 외부 스크립트 — 여러 인스턴스 시 div만 복사·스크립트는 한 번만)
function generateHTMLCode(): string {
  const config = {
    shape: currentShape,
    radius: currentRadius,
    size: currentCubeSize,
    width: currentPlaneWidth,
    height: currentPlaneHeight,
    mosaicSize: currentMosaicSize,
    mosaicCellTextureUrl: currentCellUrl,
    textureUrl: currentEarthTextureUrl,
    cellCount: currentCellCount,
    backgroundColor: 0xffffff,
    noiseIntensity: currentNoiseIntensity,
    noiseFPS: currentNoiseFPS,
  };
  const configJson = JSON.stringify(config);
  return `<div class="canvas-container ascmosaic" style="width:100%;height:500px;" data-ascmosaic-config='${configJson}'></div>
<script type="module" src="./ascmosaic-app.js"></script>`;
}

// 새 창 미리보기용: 스니펫을 최소 뼈대 HTML로 감싸고, 스크립트/텍스처는 현재 오리진으로 로드
function buildPreviewHTML(snippet: string): string {
  const origin = location.origin;
  const scriptUrl = new URL('/ascmosaic-app.js', origin).href;
  const baseUrlScript = `<script>window.ASC_MOSAIC_BASE_URL = ${JSON.stringify(origin)};</script>\n`;
  const bodyContent = snippet.replace(
    '<script type="module" src="./ascmosaic-app.js"></script>',
    `<script type="module" src="${scriptUrl}"></script>`
  );
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AscMosaic 미리보기</title>
  <style>
    body { margin: 0; padding: 20px; background: #f5f5f5; }
    .canvas-container { cursor: grab; }
    .canvas-container:active { cursor: grabbing; }
  </style>
</head>
<body>
${baseUrlScript}${bodyContent}
</body>
</html>`;
}

// HTML 코드 생성 버튼 이벤트
generateHtmlBtn.addEventListener('click', () => {
  const htmlCode = generateHTMLCode();
  generatedHtmlCode.value = htmlCode;
  generatedHtmlCode.style.display = 'block';
  previewHtmlBtn.style.display = 'inline-block';
  
  // 텍스트 선택 (복사하기 쉽게)
  generatedHtmlCode.select();
});

// 새 창에서 확인 버튼 이벤트 (스니펫을 뼈대 HTML로 감싸고, 스크립트는 현재 오리진으로 로드)
previewHtmlBtn.addEventListener('click', () => {
  const snippet = generateHTMLCode();
  const fullHtml = buildPreviewHTML(snippet);
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');
  if (newWindow) {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
});

// 리소스 로드 후 애니메이션 시작
loadResourceList().then(() => animate());
