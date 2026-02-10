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
let currentTextureUrl = '/textures/mosaic_cell.png';

// ASCII 필터 토글 버튼
asciiToggleBtn.addEventListener('click', async () => {
  try {
    await mosaic.toggleAsciiMosaicFilter({
      mosaicSize: currentMosaicSize, // 모자이크 블록 크기
      mosaicCellTextureUrl: currentTextureUrl, // 모자이크 셀 아틀라스
      cellCount: 6, // 아틀라스의 셀 개수 (가로 방향)
      backgroundColor: 0xffffff, // 흰색 배경
      noiseIntensity: currentNoiseIntensity, // 노이즈 강도 (0.0 ~ 1.0)
      noiseFPS: currentNoiseFPS, // 노이즈 업데이트 FPS
    });

    // 버튼 텍스트 업데이트
    if (mosaic.isAsciiMosaicFilterEnabled()) {
      asciiToggleBtn.textContent = 'ASCII 필터 끄기';
      asciiToggleBtn.style.background = '#28a745';
      pixelSizeContainer.style.display = 'flex'; // 슬라이더 표시
      noiseIntensityContainer.style.display = 'flex'; // 노이즈 강도 슬라이더 표시
      noiseFPSContainer.style.display = 'flex'; // 노이즈 FPS 슬라이더 표시
      textureSelectorContainer.style.display = 'flex'; // 텍스처 선택 표시
    } else {
      asciiToggleBtn.textContent = 'ASCII 필터 토글';
      asciiToggleBtn.style.background = '#667eea';
      pixelSizeContainer.style.display = 'none'; // 슬라이더 숨김
      noiseIntensityContainer.style.display = 'none'; // 노이즈 강도 슬라이더 숨김
      noiseFPSContainer.style.display = 'none'; // 노이즈 FPS 슬라이더 숨김
      textureSelectorContainer.style.display = 'none'; // 텍스처 선택 숨김
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
        cellCount: 6,
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

// 애니메이션 시작
animate();

// 초기 큐브 추가 (선택사항)
// mosaic.addCube();
// mosaic.animate();
