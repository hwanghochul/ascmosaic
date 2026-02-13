import { AscMosaic, createCube, createSphere } from '../src/index';
import * as THREE from 'three';

// DOM 요소 가져오기
const canvasContainer = document.getElementById('canvas-container')!;
const addCubeBtn = document.getElementById('add-cube-btn')!;
const addSphereBtn = document.getElementById('add-sphere-btn')!;
const clearBtn = document.getElementById('clear-btn')!;
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
const textureSelectorContainer = document.getElementById('texture-selector-container')!;
const textureSelectors = document.querySelectorAll('input[name="texture-select"]') as NodeListOf<HTMLInputElement>;
const cellCountContainer = document.getElementById('cell-count-container')!;
const cellCountSlider = document.getElementById('cell-count-slider')! as HTMLInputElement;
const cellCountValue = document.getElementById('cell-count-value')!;
const generateHtmlBtn = document.getElementById('generate-html-btn')!;
const previewHtmlBtn = document.getElementById('preview-html-btn')!;
const generatedHtmlCode = document.getElementById('generated-html-code')! as HTMLTextAreaElement;

// AscMosaic 인스턴스 생성
const mosaic = new AscMosaic(canvasContainer);

// Scene, Camera, Renderer 가져오기
const scene = mosaic.getScene();
const camera = mosaic.getCamera();
const renderer = mosaic.getRenderer();

// 저장된 메시들
const meshes: THREE.Mesh[] = [];

// 큐브 추가 버튼
addCubeBtn.addEventListener('click', () => {
  const cube = createCube(1, Math.random() * 0xffffff);
  cube.position.set(
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4
  );
  scene.add(cube);
  meshes.push(cube);
});

// 구 추가 버튼
addSphereBtn.addEventListener('click', () => {
  const sphere = createSphere(0.5, Math.random() * 0xffffff);
  sphere.position.set(
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4
  );
  scene.add(sphere);
  meshes.push(sphere);
});

// 초기화 버튼
clearBtn.addEventListener('click', () => {
  meshes.forEach(mesh => {
    mesh.geometry.dispose();
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose();
    }
    scene.remove(mesh);
  });
  meshes.length = 0;
});

// 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);

  // 모든 메시 회전
  meshes.forEach(mesh => {
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
  });

  // AscMosaic의 렌더링 메서드 사용 (필터 지원)
  mosaic.renderOnce();
}

// 현재 설정값 저장
let currentMosaicSize = 10;
let currentNoiseIntensity = 0.0;
let currentNoiseFPS = 10;
let currentCellCount = 6;
let currentTextureUrl = '/textures/mosaic_cell.png';

// ASCII 필터 토글 버튼
asciiToggleBtn.addEventListener('click', async () => {
  try {
    await mosaic.toggleAsciiMosaicFilter({
      mosaicSize: currentMosaicSize, // 모자이크 블록 크기
      mosaicCellTextureUrl: currentTextureUrl, // 모자이크 셀 아틀라스
      cellCount: currentCellCount, // 아틀라스의 셀 개수 (가로 방향)
      backgroundColor: 0xffffff, // 흰색 배경
      noiseIntensity: currentNoiseIntensity, // 노이즈 강도 (0.0 ~ 1.0)
      noiseFPS: currentNoiseFPS, // 노이즈 업데이트 FPS
    });

    // 버튼 텍스트 업데이트
    if (mosaic.isAsciiMosaicFilterEnabled()) {
      asciiToggleBtn.textContent = 'ASCII 필터 끄기';
      asciiToggleBtn.style.background = '#28a745';
      pixelSizeContainer.style.display = 'flex';
      noiseIntensityContainer.style.display = 'flex';
      noiseFPSContainer.style.display = 'flex';
      cellCountContainer.style.display = 'flex';
      textureSelectorContainer.style.display = 'flex';
    } else {
      asciiToggleBtn.textContent = 'ASCII 필터 토글';
      asciiToggleBtn.style.background = '#667eea';
      pixelSizeContainer.style.display = 'none';
      noiseIntensityContainer.style.display = 'none';
      noiseFPSContainer.style.display = 'none';
      cellCountContainer.style.display = 'none';
      textureSelectorContainer.style.display = 'none';
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
      mosaicCellTextureUrl: currentTextureUrl,
      cellCount: currentCellCount,
      backgroundColor: 0xffffff,
      noiseIntensity: currentNoiseIntensity,
      noiseFPS: currentNoiseFPS,
    });
  }
});

// 텍스처 선택 이벤트
textureSelectors.forEach(selector => {
  selector.addEventListener('change', async (e) => {
    const selectedTexture = (e.target as HTMLInputElement).value;
    currentTextureUrl = selectedTexture;
    
    // 필터가 활성화되어 있으면 재활성화하여 새 텍스처 적용
    if (mosaic.isAsciiMosaicFilterEnabled()) {
      await mosaic.disableAsciiMosaicFilter();
      await mosaic.enableAsciiMosaicFilter({
        mosaicSize: currentMosaicSize,
        mosaicCellTextureUrl: currentTextureUrl,
        cellCount: currentCellCount,
        backgroundColor: 0xffffff,
        noiseIntensity: currentNoiseIntensity,
        noiseFPS: currentNoiseFPS,
      });
    }
  });
});

// 조명 추가 (지구본을 위해 필요)
mosaic.addLights();

// 지구본 추가
mosaic.addEarth({
  radius: 2,
  widthSegments: 64,
  heightSegments: 32,
});

// OrbitControls 설정 (마우스로 지구본 회전 및 줌)
mosaic.setupOrbitControls({
  minDistance: 3,
  maxDistance: 10,
  rotateSpeed: 1.0,
  zoomSpeed: 0.1,
});

// HTML 스니펫 생성 (컨테이너별 data 설정, 로직은 외부 스크립트 — 여러 인스턴스 시 div만 복사·스크립트는 한 번만)
function generateHTMLCode(): string {
  const config = {
    mosaicSize: currentMosaicSize,
    mosaicCellTextureUrl: currentTextureUrl,
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

// 애니메이션 시작
animate();

// 초기 큐브 추가 (선택사항)
// mosaic.addCube();
// mosaic.animate();
