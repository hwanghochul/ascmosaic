import { AscMosaic, THREE } from '../src/index';

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
const modelSelectContainer = document.getElementById('model-select-container')!;
const modelSelect = document.getElementById('model-select')! as HTMLSelectElement;
const scaleSlider = document.getElementById('scale-slider')! as HTMLInputElement;
const scaleValue = document.getElementById('scale-value')!;
const textureSelectContainer = document.getElementById('texture-select-container')!;
const textureSelect = document.getElementById('texture-select')! as HTMLSelectElement;
const controlModeSelect = document.getElementById('control-mode-select')! as HTMLSelectElement;
const tiltInvertContainer = document.getElementById('tilt-invert-container')!;
const tiltInvertX = document.getElementById('tilt-invert-x')! as HTMLInputElement;
const tiltInvertY = document.getElementById('tilt-invert-y')! as HTMLInputElement;
const tiltSettingsContainer = document.getElementById('tilt-settings-container')!;
const tiltMaxAngleSlider = document.getElementById('tilt-max-angle')! as HTMLInputElement;
const tiltMaxAngleValue = document.getElementById('tilt-max-angle-value')!;
const tiltSmoothnessSlider = document.getElementById('tilt-smoothness')! as HTMLInputElement;
const tiltSmoothnessValue = document.getElementById('tilt-smoothness-value')!;
const cellCountContainer = document.getElementById('cell-count-container')!;
const cellCountSlider = document.getElementById('cell-count-slider')! as HTMLInputElement;
const cellCountValue = document.getElementById('cell-count-value')!;
const setConfigContainer = document.getElementById('set-config-container')!;
const setCountSlider = document.getElementById('set-count-slider')! as HTMLInputElement;
const setCountValue = document.getElementById('set-count-value')!;
const setSelectionModeSelect = document.getElementById('set-selection-mode-select')! as HTMLSelectElement;
const offsetRowRadiusContainer = document.getElementById('offset-row-radius-container')!;
const offsetRowRadiusSlider = document.getElementById('offset-row-radius-slider')! as HTMLInputElement;
const offsetRowRadiusValue = document.getElementById('offset-row-radius-value')!;
const avoidContainer = document.getElementById('avoid-container')!;
const avoidCheckbox = document.getElementById('avoid-checkbox')! as HTMLInputElement;
const avoidRadiusContainer = document.getElementById('avoid-radius-container')!;
const avoidRadiusSlider = document.getElementById('avoid-radius-slider')! as HTMLInputElement;
const avoidRadiusValue = document.getElementById('avoid-radius-value')!;
const avoidStrengthContainer = document.getElementById('avoid-strength-container')!;
const avoidStrengthSlider = document.getElementById('avoid-strength-slider')! as HTMLInputElement;
const avoidStrengthValue = document.getElementById('avoid-strength-value')!;
const adjustCellOrderContainer = document.getElementById('adjust-cell-order-container')!;
const adjustCellOrderCheckbox = document.getElementById('adjust-cell-order-checkbox')! as HTMLInputElement;
const generateHtmlBtn = document.getElementById('generate-html-btn')!;
const previewHtmlBtn = document.getElementById('preview-html-btn')!;
const copyCodeBtn = document.getElementById('copy-code-btn')!;
const realTimeCodeToggle = document.getElementById('realtime-code-toggle')! as HTMLInputElement;
const generatedHtmlCode = document.getElementById('generated-html-code')! as HTMLTextAreaElement;
const canvasWidthSlider = document.getElementById('canvas-width-slider')! as HTMLInputElement;
const canvasWidthValue = document.getElementById('canvas-width-value')!;
const canvasHeightSlider = document.getElementById('canvas-height-slider')! as HTMLInputElement;
const canvasHeightValue = document.getElementById('canvas-height-value')!;
const cameraPosXSlider = document.getElementById('camera-pos-x-slider')! as HTMLInputElement;
const cameraPosXValue = document.getElementById('camera-pos-x-value')!;
const cameraPosYSlider = document.getElementById('camera-pos-y-slider')! as HTMLInputElement;
const cameraPosYValue = document.getElementById('camera-pos-y-value')!;
const cameraPosZSlider = document.getElementById('camera-pos-z-slider')! as HTMLInputElement;
const cameraPosZValue = document.getElementById('camera-pos-z-value')!;
const cameraThetaSlider = document.getElementById('camera-theta-slider')! as HTMLInputElement;
const cameraThetaValue = document.getElementById('camera-theta-value')!;
const cameraPhiSlider = document.getElementById('camera-phi-slider')! as HTMLInputElement;
const cameraPhiValue = document.getElementById('camera-phi-value')!;
const cameraDistanceSlider = document.getElementById('camera-distance-slider')! as HTMLInputElement;
const cameraDistanceValue = document.getElementById('camera-distance-value')!;
const cameraFovSlider = document.getElementById('camera-fov-slider')! as HTMLInputElement;
const cameraFovValue = document.getElementById('camera-fov-value')!;
const cameraResetBtn = document.getElementById('camera-reset-btn')!;
const cameraOrbitGroup = document.getElementById('camera-orbit-group')!;
const backgroundColorInput = document.getElementById('background-color-input')! as HTMLInputElement;

let realTimeCodeGen = true;
let currentCameraFov = 75;
let currentCanvasWidth = 800;
let currentCanvasHeight = 600;
let currentBackgroundColor = '#ffffff';
let lastCameraState: { target: THREE.Vector3; distance: number; theta: number; phi: number } | null = null;
let cameraStateSaveTimeout: number | null = null;

// URL에서 상태 복원
function loadStateFromURL(): boolean {
  const params = new URLSearchParams(window.location.search);
  const stateJson = params.get('state');
  if (!stateJson) return false;
  
  try {
    const state = JSON.parse(decodeURIComponent(stateJson));
    
    // 기본값으로 복원
    if (state.mosaicSize !== undefined) currentMosaicSize = state.mosaicSize;
    if (state.noiseIntensity !== undefined) currentNoiseIntensity = state.noiseIntensity;
    if (state.noiseFPS !== undefined) currentNoiseFPS = state.noiseFPS;
    if (state.cellCount !== undefined) currentCellCount = state.cellCount;
    if (state.cellUrl !== undefined) currentCellUrl = state.cellUrl;
    if (state.setCount !== undefined) currentSetCount = state.setCount;
    if (state.setSelectionMode !== undefined) currentSetSelectionMode = state.setSelectionMode;
    if (state.offsetRowRadius !== undefined) currentOffsetRowRadius = state.offsetRowRadius;
    if (state.avoid !== undefined) currentAvoid = state.avoid;
    if (state.avoidRadius !== undefined) currentAvoidRadius = state.avoidRadius;
    if (state.avoidStrength !== undefined) {
      // 기존 소수 값(0.15 등)을 픽셀 단위로 변환 (호환성)
      if (state.avoidStrength < 1.0) {
        // 기존 형식: 화면 크기 의존적이었으므로 평균적으로 20픽셀 정도로 변환
        currentAvoidStrength = Math.round(state.avoidStrength * 100);
      } else {
        // 새 형식: 이미 픽셀 단위
        currentAvoidStrength = state.avoidStrength;
      }
    }
    if (state.adjustCellOrder !== undefined) currentAdjustCellOrder = state.adjustCellOrder;
    if (state.shape !== undefined) currentShape = state.shape;
    if (state.radius !== undefined) currentRadius = state.radius;
    if (state.cubeSize !== undefined) currentCubeSize = state.cubeSize;
    if (state.planeWidth !== undefined) currentPlaneWidth = state.planeWidth;
    if (state.planeHeight !== undefined) currentPlaneHeight = state.planeHeight;
    if (state.modelUrl !== undefined) currentModelUrl = state.modelUrl;
    if (state.scale !== undefined) currentScale = state.scale;
    if (state.textureUrl !== undefined) currentEarthTextureUrl = state.textureUrl;
    if (state.textureType !== undefined) currentTextureType = state.textureType;
    if (state.controlMode !== undefined) currentControlMode = state.controlMode;
    if (state.tiltInvertX !== undefined) currentTiltInvertX = state.tiltInvertX;
    if (state.tiltInvertY !== undefined) currentTiltInvertY = state.tiltInvertY;
    if (state.tiltMaxAngle !== undefined) currentTiltMaxAngle = state.tiltMaxAngle;
    if (state.tiltSmoothness !== undefined) currentTiltSmoothness = state.tiltSmoothness;
    if (state.canvasWidth !== undefined) currentCanvasWidth = state.canvasWidth;
    if (state.canvasHeight !== undefined) currentCanvasHeight = state.canvasHeight;
    if (state.realTimeCodeGen !== undefined) realTimeCodeGen = state.realTimeCodeGen;
    if (state.backgroundColor !== undefined) currentBackgroundColor = state.backgroundColor;
    
    // 카메라 상태 복원
    if (state.cameraTarget && state.cameraDistance !== undefined && 
        state.cameraTheta !== undefined && state.cameraPhi !== undefined) {
      // applyStateToUI에서 OrbitControls가 설정된 후 복원하도록 플래그 설정
      (window as any).__restoreCameraState = {
        target: state.cameraTarget,
        distance: state.cameraDistance,
        theta: state.cameraTheta,
        phi: state.cameraPhi,
      };
    }
    
    return true;
  } catch {
    return false;
  }
}

// 상태를 URL에 저장
function saveStateToURL(): void {
  const state = {
    mosaicSize: currentMosaicSize,
    noiseIntensity: currentNoiseIntensity,
    noiseFPS: currentNoiseFPS,
    cellCount: currentCellCount,
    cellUrl: currentCellUrl,
    setCount: currentSetCount,
    setSelectionMode: currentSetSelectionMode,
    offsetRowRadius: currentOffsetRowRadius,
    avoid: currentAvoid,
    avoidRadius: currentAvoidRadius,
    avoidStrength: currentAvoidStrength,
    textureType: currentTextureType,
    shape: currentShape,
    radius: currentRadius,
    cubeSize: currentCubeSize,
    planeWidth: currentPlaneWidth,
    planeHeight: currentPlaneHeight,
    modelUrl: currentModelUrl,
    scale: currentScale,
    textureUrl: currentEarthTextureUrl,
    controlMode: currentControlMode,
    tiltInvertX: currentTiltInvertX,
    tiltInvertY: currentTiltInvertY,
    tiltMaxAngle: currentTiltMaxAngle,
    tiltSmoothness: currentTiltSmoothness,
    canvasWidth: currentCanvasWidth,
    canvasHeight: currentCanvasHeight,
    realTimeCodeGen: realTimeCodeGen,
    backgroundColor: currentBackgroundColor,
  };
  
  // 카메라 상태 저장 (OrbitControls가 활성화되어 있을 때만)
  const orbitControls = mosaic.getOrbitControls();
  if (orbitControls && currentControlMode === 'orbit') {
    const cameraState = orbitControls.getCameraState();
    (state as any).cameraTarget = {
      x: cameraState.target.x,
      y: cameraState.target.y,
      z: cameraState.target.z,
    };
    (state as any).cameraDistance = cameraState.distance;
    (state as any).cameraTheta = cameraState.theta;
    (state as any).cameraPhi = cameraState.phi;
  }
  
  const stateJson = encodeURIComponent(JSON.stringify(state));
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('state', stateJson);
  window.history.replaceState({}, '', newUrl.toString());
}

// 아코디언 초기화
function initAccordion(): void {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach((header) => {
    header.addEventListener('click', () => {
      const section = header.closest('.accordion-section');
      if (!section) return;
      const content = section.querySelector('.accordion-content');
      if (!content) return;
      const isOpen = section.classList.contains('open');
      if (isOpen) {
        section.classList.remove('open');
        (content as HTMLElement).style.display = 'none';
      } else {
        section.classList.add('open');
        (content as HTMLElement).style.display = 'block';
      }
    });
  });
  // 초기 상태: open인 섹션만 콘텐츠 표시
  document.querySelectorAll('.accordion-section').forEach((section) => {
    const content = section.querySelector('.accordion-content');
    if (content) {
      (content as HTMLElement).style.display = section.classList.contains('open') ? 'block' : 'none';
    }
  });
}
initAccordion();

// AscMosaic 인스턴스 생성
const mosaic = new AscMosaic(canvasContainer);

// 애니메이션 루프
let lastCameraPosition = { x: 0, y: 0, z: 0 };
let lastCameraRotation = { x: 0, y: 0, z: 0 };

function animate() {
  requestAnimationFrame(animate);
  mosaic.renderOnce();
  checkCameraUpdate();
}

// 리소스 목록 (resource_list.json에서 로드)
interface ResourceList {
  cells: string[];
  textures: string[];
  video_textures?: string[];
  models?: string[];
}

type ShapeType = 'sphere' | 'cube' | 'plane' | 'glb';

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
let currentModelUrl = '';
let currentScale = 1;
let currentControlMode: 'orbit' | 'fixed' | 'tilt' = 'orbit';
let currentTiltInvertX = false;
let currentTiltInvertY = false;
let currentTiltMaxAngle = 30; // 도 단위
let currentTiltSmoothness = 0.15;
let currentSetCount = 1;
let currentSetSelectionMode: 'first' | 'random' | 'cycle' | 'offsetRow' = 'first';
let currentOffsetRowRadius = 80;
let currentAvoid = false;
let currentAvoidRadius = 80;
let currentAvoidStrength = 20; // 픽셀 단위
let currentAdjustCellOrder = false;
let currentTextureType: 'image' | 'video' = 'image';

function getMosaicFilterOptions() {
  return {
    mosaicSize: currentMosaicSize,
    mosaicCellTextureUrl: currentCellUrl,
    cellCount: currentCellCount,
    noiseIntensity: currentNoiseIntensity,
    noiseFPS: currentNoiseFPS,
    setCount: currentSetCount,
    setSelectionMode: currentSetSelectionMode,
    offsetRowRadius: currentOffsetRowRadius,
    avoid: currentAvoid,
    avoidRadius: currentAvoidRadius,
    avoidStrength: currentAvoidStrength,
    adjustCellOrder: currentAdjustCellOrder,
  };
}

function getModelOptions() {
  const base: Record<string, unknown> = {
    shape: currentShape,
    scale: currentScale,
  };
  if (currentShape === 'glb') {
    base.modelUrl = currentModelUrl || undefined;
  } else {
    base.textureUrl = currentEarthTextureUrl;
    base.textureType = currentTextureType;
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
  }
  return base;
}

async function applyModel() {
  await mosaic.addModel(getModelOptions());
}

function showShapeParams(shape: ShapeType) {
  shapeSphereParams.style.display = shape === 'sphere' ? 'flex' : 'none';
  shapeCubeParams.style.display = shape === 'cube' ? 'flex' : 'none';
  shapePlaneParams.style.display = shape === 'plane' ? 'block' : 'none';
  modelSelectContainer.style.display = shape === 'glb' ? 'flex' : 'none';
  textureSelectContainer.style.display = shape === 'glb' ? 'none' : 'flex';
}

// 초기 도형 서브 UI 표시
showShapeParams(currentShape);

// ASCII 필터 토글 버튼
asciiToggleBtn.addEventListener('click', async () => {
  try {
    await mosaic.toggleAsciiMosaicFilter(getMosaicFilterOptions());

    if (mosaic.isAsciiMosaicFilterEnabled()) {
      asciiToggleBtn.textContent = 'ASCII 필터 끄기';
      asciiToggleBtn.style.background = '#28a745';
      pixelSizeContainer.style.display = 'flex';
      noiseIntensityContainer.style.display = 'flex';
      noiseFPSContainer.style.display = 'flex';
      cellCountContainer.style.display = 'flex';
      cellSelectContainer.style.display = 'flex';
      setConfigContainer.style.display = 'block';
      avoidContainer.style.display = 'flex';
      avoidRadiusContainer.style.display = currentAvoid ? 'flex' : 'none';
      avoidStrengthContainer.style.display = currentAvoid ? 'flex' : 'none';
      adjustCellOrderContainer.style.display = currentAvoid ? 'flex' : 'none';
      offsetRowRadiusContainer.style.display = currentSetSelectionMode === 'offsetRow' ? 'flex' : 'none';
      setCountValue.textContent = String(currentSetCount);
      mosaic.setSetSelectionMode(currentSetSelectionMode);
      mosaic.setOffsetRowRadius(currentOffsetRowRadius);
      mosaic.setAvoid(currentAvoid);
      mosaic.setAvoidRadius(currentAvoidRadius);
      mosaic.setAvoidStrength(currentAvoidStrength);
      const filter = mosaic.getAsciiMosaicFilter();
      if (filter) {
        (filter as any).setAdjustCellOrder(currentAdjustCellOrder);
      }
      updateHTMLCodeIfRealtime();
    } else {
      asciiToggleBtn.textContent = 'ASCII 필터 토글';
      asciiToggleBtn.style.background = '#667eea';
      pixelSizeContainer.style.display = 'none';
      noiseIntensityContainer.style.display = 'none';
      noiseFPSContainer.style.display = 'none';
      cellCountContainer.style.display = 'none';
      cellSelectContainer.style.display = 'none';
      setConfigContainer.style.display = 'none';
      avoidContainer.style.display = 'none';
      avoidRadiusContainer.style.display = 'none';
      avoidStrengthContainer.style.display = 'none';
    }
    updateHTMLCodeIfRealtime();
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
  updateHTMLCodeIfRealtime();
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
  updateHTMLCodeIfRealtime();
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
  updateHTMLCodeIfRealtime();
});

// 셀 개수 슬라이더 이벤트
cellCountSlider.addEventListener('input', async (e) => {
  const count = parseInt((e.target as HTMLInputElement).value);
  currentCellCount = count;
  cellCountValue.textContent = count.toString();

  if (mosaic.isAsciiMosaicFilterEnabled()) {
    await mosaic.disableAsciiMosaicFilter();
    await mosaic.enableAsciiMosaicFilter(getMosaicFilterOptions());
  }
  updateHTMLCodeIfRealtime();
});

// 세트 개수 슬라이더 이벤트
setCountSlider.addEventListener('input', (e) => {
  const count = parseInt((e.target as HTMLInputElement).value);
  currentSetCount = count;
  setCountValue.textContent = count.toString();
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setSetCount(count);
  }
  updateHTMLCodeIfRealtime();
});

// 세트 선택 모드 이벤트
setSelectionModeSelect.addEventListener('change', () => {
  currentSetSelectionMode = setSelectionModeSelect.value as 'first' | 'random' | 'cycle' | 'offsetRow';
  offsetRowRadiusContainer.style.display = currentSetSelectionMode === 'offsetRow' ? 'flex' : 'none';
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setSetSelectionMode(currentSetSelectionMode);
    mosaic.setOffsetRowRadius(currentOffsetRowRadius);
  }
  updateHTMLCodeIfRealtime();
});

// 세트변경 마우스 영향 범위 슬라이더 이벤트
offsetRowRadiusSlider.addEventListener('input', (e) => {
  const radius = parseInt((e.target as HTMLInputElement).value);
  currentOffsetRowRadius = radius;
  offsetRowRadiusValue.textContent = radius.toString();
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setOffsetRowRadius(radius);
  }
  updateHTMLCodeIfRealtime();
});

// 회피하기 체크박스 이벤트 (켜질 때만 서브 설정 UI 표시)
avoidCheckbox.addEventListener('change', () => {
  currentAvoid = avoidCheckbox.checked;
  avoidRadiusContainer.style.display = currentAvoid ? 'flex' : 'none';
  avoidStrengthContainer.style.display = currentAvoid ? 'flex' : 'none';
  adjustCellOrderContainer.style.display = currentAvoid ? 'flex' : 'none';
  if (!currentAvoid) {
    currentAdjustCellOrder = false;
    adjustCellOrderCheckbox.checked = false;
  }
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setAvoid(currentAvoid);
    if (mosaic.getAsciiMosaicFilter()) {
      (mosaic.getAsciiMosaicFilter() as any).setAdjustCellOrder(currentAdjustCellOrder);
    }
  }
  updateHTMLCodeIfRealtime();
});

// 셀 순서조정 체크박스 이벤트
adjustCellOrderCheckbox.addEventListener('change', () => {
  currentAdjustCellOrder = adjustCellOrderCheckbox.checked;
  if (mosaic.isAsciiMosaicFilterEnabled() && mosaic.getAsciiMosaicFilter()) {
    (mosaic.getAsciiMosaicFilter() as any).setAdjustCellOrder(currentAdjustCellOrder);
  }
  updateHTMLCodeIfRealtime();
});

// 마우스 영향 범위 슬라이더 이벤트
avoidRadiusSlider.addEventListener('input', (e) => {
  const radius = parseInt((e.target as HTMLInputElement).value);
  currentAvoidRadius = radius;
  avoidRadiusValue.textContent = radius.toString();
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setAvoidRadius(radius);
  }
  updateHTMLCodeIfRealtime();
});

// 이동 강도 슬라이더 이벤트 (0.05~0.5, 슬라이더 5~50)
avoidStrengthSlider.addEventListener('input', (e) => {
  const strength = parseInt((e.target as HTMLInputElement).value);
  currentAvoidStrength = strength;
  avoidStrengthValue.textContent = strength.toString();
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    mosaic.setAvoidStrength(strength);
  }
  updateHTMLCodeIfRealtime();
});

// 셀 선택 이벤트
cellSelect.addEventListener('change', async () => {
  const value = cellSelect.value;
  if (!value) return;
  currentCellUrl = value;
  if (mosaic.isAsciiMosaicFilterEnabled()) {
    await mosaic.disableAsciiMosaicFilter();
    await mosaic.enableAsciiMosaicFilter(getMosaicFilterOptions());
  }
  updateHTMLCodeIfRealtime();
});

// 도형 선택 이벤트
shapeSelect.addEventListener('change', async () => {
  currentShape = shapeSelect.value as ShapeType;
  showShapeParams(currentShape);
  await applyModel();
  updateHTMLCodeIfRealtime();
});

// 구 반지름
sphereRadiusSlider.addEventListener('input', async () => {
  currentRadius = parseFloat(sphereRadiusSlider.value);
  sphereRadiusValue.textContent = currentRadius.toFixed(1);
  await applyModel();
  updateHTMLCodeIfRealtime();
});

// 큐브 크기
cubeSizeSlider.addEventListener('input', async () => {
  currentCubeSize = parseFloat(cubeSizeSlider.value);
  cubeSizeValue.textContent = currentCubeSize.toFixed(1);
  await applyModel();
  updateHTMLCodeIfRealtime();
});

// 평면 가로/세로
planeWidthSlider.addEventListener('input', async () => {
  currentPlaneWidth = parseFloat(planeWidthSlider.value);
  planeWidthValue.textContent = currentPlaneWidth.toFixed(1);
  await applyModel();
  updateHTMLCodeIfRealtime();
});
planeHeightSlider.addEventListener('input', async () => {
  currentPlaneHeight = parseFloat(planeHeightSlider.value);
  planeHeightValue.textContent = currentPlaneHeight.toFixed(1);
  await applyModel();
  updateHTMLCodeIfRealtime();
});

// 크기(scale) 슬라이더
scaleSlider.addEventListener('input', async () => {
  currentScale = parseFloat(scaleSlider.value);
  scaleValue.textContent = currentScale.toFixed(1);
  await applyModel();
  updateHTMLCodeIfRealtime();
});

// GLB 모델 선택 이벤트
modelSelect.addEventListener('change', async () => {
  currentModelUrl = modelSelect.value;
  await applyModel();
  updateHTMLCodeIfRealtime();
});

// 텍스처 선택 이벤트
textureSelect.addEventListener('change', async () => {
  const value = textureSelect.value;
  if (!value) return;
  currentEarthTextureUrl = value;
  const selectedOpt = textureSelect.options[textureSelect.selectedIndex];
  const type = selectedOpt?.getAttribute('data-texture-type');
  currentTextureType = type === 'video' ? 'video' : 'image';
  await applyModel();
  updateHTMLCodeIfRealtime();
});

// 컨트롤 모드 선택 이벤트
controlModeSelect.addEventListener('change', () => {
  currentControlMode = controlModeSelect.value as 'orbit' | 'fixed' | 'tilt';
  
  // 기울임 반전 UI 및 설정 UI 표시/숨김
  if (currentControlMode === 'tilt') {
    tiltInvertContainer.style.display = 'flex';
    tiltSettingsContainer.style.display = 'block';
  } else {
    tiltInvertContainer.style.display = 'none';
    tiltSettingsContainer.style.display = 'none';
  }
  
  // 에디터에서도 즉시 적용
  if (currentControlMode === 'orbit') {
    mosaic.disableTiltControls();
    mosaic.setupOrbitControls({
      minDistance: 3,
      maxDistance: 10,
      rotateSpeed: 1.0,
      zoomSpeed: 0.1,
    });
  } else if (currentControlMode === 'tilt') {
    const maxAngleRad = (currentTiltMaxAngle * Math.PI) / 180; // 도를 라디안으로 변환
    mosaic.setupTiltControls(currentTiltInvertX, currentTiltInvertY, maxAngleRad, currentTiltSmoothness);
  } else {
    // fixed: 모든 컨트롤 제거
    mosaic.disableTiltControls();
    const orbitControls = mosaic.getOrbitControls();
    if (orbitControls) {
      orbitControls.dispose();
    }
  }
  updateCameraControls();
  updateHTMLCodeIfRealtime();
});

// 기울임 반전 체크박스 이벤트
tiltInvertX.addEventListener('change', () => {
  currentTiltInvertX = tiltInvertX.checked;
  if (currentControlMode === 'tilt') {
    const maxAngleRad = (currentTiltMaxAngle * Math.PI) / 180;
    mosaic.setupTiltControls(currentTiltInvertX, currentTiltInvertY, maxAngleRad, currentTiltSmoothness);
  }
  updateHTMLCodeIfRealtime();
});

tiltInvertY.addEventListener('change', () => {
  currentTiltInvertY = tiltInvertY.checked;
  if (currentControlMode === 'tilt') {
    const maxAngleRad = (currentTiltMaxAngle * Math.PI) / 180;
    mosaic.setupTiltControls(currentTiltInvertX, currentTiltInvertY, maxAngleRad, currentTiltSmoothness);
  }
  updateHTMLCodeIfRealtime();
});

// 기울임 최대 각도 슬라이더 이벤트
tiltMaxAngleSlider.addEventListener('input', () => {
  currentTiltMaxAngle = parseFloat(tiltMaxAngleSlider.value);
  tiltMaxAngleValue.textContent = currentTiltMaxAngle.toString();
  if (currentControlMode === 'tilt') {
    const maxAngleRad = (currentTiltMaxAngle * Math.PI) / 180;
    mosaic.setupTiltControls(currentTiltInvertX, currentTiltInvertY, maxAngleRad, currentTiltSmoothness);
  }
  updateHTMLCodeIfRealtime();
});

// 기울임 스무스 속도 슬라이더 이벤트
tiltSmoothnessSlider.addEventListener('input', () => {
  currentTiltSmoothness = parseFloat(tiltSmoothnessSlider.value);
  tiltSmoothnessValue.textContent = currentTiltSmoothness.toFixed(2);
  if (currentControlMode === 'tilt') {
    const maxAngleRad = (currentTiltMaxAngle * Math.PI) / 180;
    mosaic.setupTiltControls(currentTiltInvertX, currentTiltInvertY, maxAngleRad, currentTiltSmoothness);
  }
  updateHTMLCodeIfRealtime();
});

// 카메라 위치 슬라이더 (오비트가 아닐 때만 적용)
function applyCameraPositionFromSliders(): void {
  if (currentControlMode === 'orbit') return;
  const camera = mosaic.getCamera();
  camera.position.set(
    parseFloat(cameraPosXSlider.value),
    parseFloat(cameraPosYSlider.value),
    parseFloat(cameraPosZSlider.value)
  );
  lastCameraPosition = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  updateHTMLCodeIfRealtime();
}
cameraPosXSlider.addEventListener('input', () => {
  cameraPosXValue.textContent = cameraPosXSlider.value;
  applyCameraPositionFromSliders();
});
cameraPosYSlider.addEventListener('input', () => {
  cameraPosYValue.textContent = cameraPosYSlider.value;
  applyCameraPositionFromSliders();
});
cameraPosZSlider.addEventListener('input', () => {
  cameraPosZValue.textContent = cameraPosZSlider.value;
  applyCameraPositionFromSliders();
});

// 카메라 회전/거리 슬라이더 (오비트 모드일 때만 적용)
function applyCameraOrbitFromSliders(): void {
  const orbitControls = mosaic.getOrbitControls();
  if (!orbitControls || currentControlMode !== 'orbit') return;
  const target = orbitControls.getTarget();
  const distance = Math.max(ORBIT_MIN_DISTANCE, Math.min(ORBIT_MAX_DISTANCE, parseFloat(cameraDistanceSlider.value)));
  const theta = parseFloat(cameraThetaSlider.value);
  const phi = Math.max(ORBIT_MIN_POLAR, Math.min(ORBIT_MAX_POLAR, parseFloat(cameraPhiSlider.value)));
  orbitControls.setCameraState(target, distance, theta, phi);
  cameraDistanceValue.textContent = distance.toFixed(2);
  cameraThetaValue.textContent = theta.toFixed(2);
  cameraPhiValue.textContent = phi.toFixed(2);
  updateHTMLCodeIfRealtime();
}
cameraThetaSlider.addEventListener('input', () => {
  cameraThetaValue.textContent = cameraThetaSlider.value;
  applyCameraOrbitFromSliders();
});
cameraPhiSlider.addEventListener('input', () => {
  cameraPhiValue.textContent = cameraPhiSlider.value;
  applyCameraOrbitFromSliders();
});
cameraDistanceSlider.addEventListener('input', () => {
  cameraDistanceValue.textContent = cameraDistanceSlider.value;
  applyCameraOrbitFromSliders();
});

// FOV 슬라이더
cameraFovSlider.addEventListener('input', () => {
  const fov = Math.max(10, Math.min(120, parseFloat(cameraFovSlider.value)));
  currentCameraFov = fov;
  cameraFovValue.textContent = String(Math.round(fov));
  const camera = mosaic.getCamera();
  camera.fov = fov;
  camera.updateProjectionMatrix();
  updateHTMLCodeIfRealtime();
});

cameraResetBtn.addEventListener('click', () => {
  resetCamera();
});

// 배경색 변경
backgroundColorInput.addEventListener('input', () => {
  currentBackgroundColor = backgroundColorInput.value;
  canvasContainer.style.backgroundColor = currentBackgroundColor;
  updateHTMLCodeIfRealtime();
  saveStateToURL();
});

// 조명 추가
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
    .then(async (list: ResourceList) => {
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
        opt.setAttribute('data-texture-type', 'image');
        textureSelect.appendChild(opt);
      });
      (list.video_textures ?? []).forEach((filename) => {
        const opt = document.createElement('option');
        opt.value = base + filename;
        opt.textContent = `${filename} (비디오)`;
        opt.setAttribute('data-texture-type', 'video');
        textureSelect.appendChild(opt);
      });
      modelSelect.innerHTML = '';
      (list.models ?? []).forEach((filename) => {
        const opt = document.createElement('option');
        opt.value = base + filename;
        opt.textContent = filename;
        modelSelect.appendChild(opt);
      });
      // URL에서 복원된 값이 없으면 기본값 사용
      if (!hasStateFromURL) {
        if (list.cells?.length) currentCellUrl = base + list.cells[0];
        if (list.textures?.length) currentEarthTextureUrl = base + list.textures[0];
        if (list.models?.length) currentModelUrl = base + list.models[0];
      }
      
      // 리소스 로드 후 셀/텍스처/모델 선택 UI에 복원된 값 적용
      if (hasStateFromURL) {
        if (currentCellUrl && cellSelect.querySelector(`option[value="${currentCellUrl}"]`)) {
          cellSelect.value = currentCellUrl;
        }
        if (currentEarthTextureUrl && textureSelect.querySelector(`option[value="${currentEarthTextureUrl}"]`)) {
          textureSelect.value = currentEarthTextureUrl;
          const selOpt = textureSelect.options[textureSelect.selectedIndex];
          currentTextureType = selOpt?.getAttribute('data-texture-type') === 'video' ? 'video' : 'image';
        }
        if (currentModelUrl && modelSelect.querySelector(`option[value="${currentModelUrl}"]`)) {
          modelSelect.value = currentModelUrl;
        }
      }
      
      // URL에서 복원된 상태가 없을 때만 기본 적용
      if (!hasStateFromURL) {
        showShapeParams(currentShape);
        await applyModel();
        updateHTMLCodeIfRealtime();
      }
    })
    .catch(async (err) => {
      console.warn('resource_list.json 로드 실패, 기본값 사용:', err);
      showShapeParams(currentShape);
      await applyModel();
      updateHTMLCodeIfRealtime();
    });
}

// HTML 스니펫 생성 (도형·텍스처·필터 설정 포함, 스니펫/새 창 미리보기에서 동일 config 사용)
function generateHTMLCode(): string {
  const camera = mosaic.getCamera();
  const config: any = {
    shape: currentShape,
  };
  
  // 도형별 필요한 파라미터만 추가
  if (currentShape === 'sphere') {
    config.radius = currentRadius;
  } else if (currentShape === 'cube') {
    config.size = currentCubeSize;
  } else if (currentShape === 'plane') {
    config.width = currentPlaneWidth;
    config.height = currentPlaneHeight;
  } else if (currentShape === 'glb') {
    if (currentModelUrl) config.modelUrl = currentModelUrl;
  }
  
  // 공통 파라미터
  if (currentScale !== 1) config.scale = currentScale;
  if (currentMosaicSize !== 10) config.mosaicSize = currentMosaicSize;
  if (currentCellUrl) config.mosaicCellTextureUrl = currentCellUrl;
  if (currentEarthTextureUrl) config.textureUrl = currentEarthTextureUrl;
  if (currentTextureType !== 'image') config.textureType = currentTextureType;
  if (currentCellCount !== 6) config.cellCount = currentCellCount;
  if (currentSetCount !== 1) config.setCount = currentSetCount;
  if (currentSetSelectionMode !== 'first') config.setSelectionMode = currentSetSelectionMode;
  if (currentSetSelectionMode === 'offsetRow') config.offsetRowRadius = currentOffsetRowRadius;
  if (currentNoiseIntensity !== 0) config.noiseIntensity = currentNoiseIntensity;
  if (currentNoiseFPS !== 10) config.noiseFPS = currentNoiseFPS;
  if (currentAvoid) {
    config.avoid = true;
    config.avoidRadius = currentAvoidRadius;
    config.avoidStrength = currentAvoidStrength;
    if (currentAdjustCellOrder) config.adjustCellOrder = currentAdjustCellOrder;
  }

  // 카메라 위치/회전
  config.cameraPosition = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };
  config.cameraRotation = {
    x: camera.rotation.x,
    y: camera.rotation.y,
    z: camera.rotation.z,
  };
  
  // 컨트롤 모드
  if (currentControlMode !== 'orbit') config.controlMode = currentControlMode;
  
  // 틸트 컨트롤 파라미터는 틸트 모드일 때만 추가
  if (currentControlMode === 'tilt') {
    if (currentTiltInvertX) config.tiltInvertX = currentTiltInvertX;
    if (currentTiltInvertY) config.tiltInvertY = currentTiltInvertY;
    if (currentTiltMaxAngle !== 30) config.tiltMaxAngle = currentTiltMaxAngle;
    if (currentTiltSmoothness !== 0.15) config.tiltSmoothness = currentTiltSmoothness;
  }
  
  // 캔버스 크기
  if (currentCanvasWidth !== 800) config.canvasWidth = currentCanvasWidth;
  if (currentCanvasHeight !== 600) config.canvasHeight = currentCanvasHeight;
  
  // 배경색 스타일 생성
  const styleParts = [`width:${currentCanvasWidth}px`, `height:${currentCanvasHeight}px`];
  if (currentBackgroundColor !== '#ffffff') {
    styleParts.push(`background-color:${currentBackgroundColor}`);
  }
  const styleAttr = styleParts.join(';');
  
  const configJson = JSON.stringify(config);
  return `<!-- AscMosaic 캔버스 -->
<div class="canvas-container ascmosaic" style="${styleAttr};" data-ascmosaic-config='${configJson}'></div>

<!-- 
  여러 캔버스를 추가하는 경우:
  - 위의 <div class="canvas-container ascmosaic"> 태그는 각 캔버스마다 추가하세요
  - 아래의 <script> 태그는 페이지당 한 번만 추가하세요 (여러 캔버스가 있어도 스크립트는 한 번만 필요)
-->
<script type="module" src="./ascmosaic-app.js"></script>`;
}

function updateHTMLCode(): void {
  const htmlCode = generateHTMLCode();
  generatedHtmlCode.value = htmlCode;
}

function updateHTMLCodeIfRealtime(): void {
  if (realTimeCodeGen) updateHTMLCode();
  saveStateToURL();
}

const ORBIT_MIN_DISTANCE = 3;
const ORBIT_MAX_DISTANCE = 10;
const ORBIT_MIN_POLAR = Math.PI / 6;
const ORBIT_MAX_POLAR = (5 * Math.PI) / 6;

function getModelCenter(): THREE.Vector3 | null {
  const scene = mosaic.getScene();
  const model = scene.children.find((c) => !(c instanceof THREE.Light));
  if (!model) return null;
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) return null;
  return box.getCenter(new THREE.Vector3());
}

function resetCamera(): void {
  const center = getModelCenter() ?? new THREE.Vector3(0, 0, 0);
  const orbitControls = mosaic.getOrbitControls();
  const camera = mosaic.getCamera();

  if (orbitControls && currentControlMode === 'orbit') {
    const distance = Math.max(
      ORBIT_MIN_DISTANCE,
      Math.min(ORBIT_MAX_DISTANCE, (ORBIT_MIN_DISTANCE + ORBIT_MAX_DISTANCE) / 2)
    );
    const theta = 0;
    const phi = Math.PI / 2;
    orbitControls.setCameraState(center.clone(), distance, theta, phi);
  } else {
    const distance = Math.max(ORBIT_MIN_DISTANCE, Math.min(ORBIT_MAX_DISTANCE, 5));
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center);
  }
  lastCameraPosition = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  lastCameraRotation = { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z };
  updateCameraControls();
  updateHTMLCodeIfRealtime();
}

function updateCameraControls(): void {
  const camera = mosaic.getCamera();
  const pos = camera.position;

  cameraPosXSlider.value = String(Math.max(-20, Math.min(20, pos.x)));
  cameraPosXValue.textContent = Number(cameraPosXSlider.value).toFixed(2);
  cameraPosYSlider.value = String(Math.max(-20, Math.min(20, pos.y)));
  cameraPosYValue.textContent = Number(cameraPosYSlider.value).toFixed(2);
  cameraPosZSlider.value = String(Math.max(-20, Math.min(20, pos.z)));
  cameraPosZValue.textContent = Number(cameraPosZSlider.value).toFixed(2);

  const orbitControls = mosaic.getOrbitControls();
  if (orbitControls && currentControlMode === 'orbit') {
    cameraOrbitGroup.style.display = 'block';
    const state = orbitControls.getCameraState();
    cameraThetaSlider.min = String(-Math.PI);
    cameraThetaSlider.max = String(Math.PI);
    cameraThetaSlider.value = String(state.theta);
    cameraThetaValue.textContent = state.theta.toFixed(2);
    cameraPhiSlider.min = String(ORBIT_MIN_POLAR);
    cameraPhiSlider.max = String(ORBIT_MAX_POLAR);
    cameraPhiSlider.value = String(state.phi);
    cameraPhiValue.textContent = state.phi.toFixed(2);
    cameraDistanceSlider.min = String(ORBIT_MIN_DISTANCE);
    cameraDistanceSlider.max = String(ORBIT_MAX_DISTANCE);
    cameraDistanceSlider.value = String(state.distance);
    cameraDistanceValue.textContent = state.distance.toFixed(2);
  } else {
    cameraOrbitGroup.style.display = 'none';
  }

  currentCameraFov = camera.fov;
  cameraFovSlider.value = String(Math.round(camera.fov));
  cameraFovValue.textContent = String(Math.round(camera.fov));
}

function checkCameraUpdate(): void {
  const camera = mosaic.getCamera();
  const pos = camera.position;
  const rot = camera.rotation;
  if (
    pos.x !== lastCameraPosition.x ||
    pos.y !== lastCameraPosition.y ||
    pos.z !== lastCameraPosition.z ||
    rot.x !== lastCameraRotation.x ||
    rot.y !== lastCameraRotation.y ||
    rot.z !== lastCameraRotation.z
  ) {
    lastCameraPosition = { x: pos.x, y: pos.y, z: pos.z };
    lastCameraRotation = { x: rot.x, y: rot.y, z: rot.z };
    updateCameraControls();
    // 카메라 위치는 HTML 코드만 업데이트하고 URL은 업데이트하지 않음 (너무 자주 변경됨)
    if (realTimeCodeGen) updateHTMLCode();
  }
  
  // OrbitControls 상태 확인 및 URL 저장 (디바운스 적용)
  const orbitControls = mosaic.getOrbitControls();
  if (orbitControls && currentControlMode === 'orbit') {
    const currentState = orbitControls.getCameraState();
    const stateChanged = !lastCameraState ||
      Math.abs(currentState.target.x - lastCameraState.target.x) > 0.001 ||
      Math.abs(currentState.target.y - lastCameraState.target.y) > 0.001 ||
      Math.abs(currentState.target.z - lastCameraState.target.z) > 0.001 ||
      Math.abs(currentState.distance - lastCameraState.distance) > 0.001 ||
      Math.abs(currentState.theta - lastCameraState.theta) > 0.001 ||
      Math.abs(currentState.phi - lastCameraState.phi) > 0.001;
    
    if (stateChanged) {
      lastCameraState = {
        target: currentState.target.clone(),
        distance: currentState.distance,
        theta: currentState.theta,
        phi: currentState.phi,
      };
      
      // 디바운스: 500ms 후에 URL 저장
      if (cameraStateSaveTimeout !== null) {
        clearTimeout(cameraStateSaveTimeout);
      }
      cameraStateSaveTimeout = window.setTimeout(() => {
        saveStateToURL();
        cameraStateSaveTimeout = null;
      }, 500);
    }
  }
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

// 실시간 코드 생성 토글
realTimeCodeToggle.addEventListener('change', () => {
  realTimeCodeGen = realTimeCodeToggle.checked;
  generateHtmlBtn.style.display = realTimeCodeGen ? 'none' : 'inline-block';
  if (realTimeCodeGen) updateHTMLCode();
  saveStateToURL();
});

// HTML 코드 생성 버튼 (실시간 꺼져 있을 때만 표시)
generateHtmlBtn.addEventListener('click', () => {
  updateHTMLCode();
  generatedHtmlCode.select();
});

// 코드 복사 버튼
copyCodeBtn.addEventListener('click', async () => {
  const text = generatedHtmlCode.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const prev = copyCodeBtn.textContent;
    copyCodeBtn.textContent = '복사됨';
    setTimeout(() => { copyCodeBtn.textContent = prev; }, 1500);
  } catch {
    generatedHtmlCode.select();
    document.execCommand('copy');
  }
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

// 캔버스 크기 변경 함수
function updateCanvasSize(width: number, height: number): void {
  currentCanvasWidth = width;
  currentCanvasHeight = height;
  canvasContainer.style.width = `${width}px`;
  canvasContainer.style.height = `${height}px`;
  mosaic.setCanvasSize(width, height);
  updateHTMLCodeIfRealtime();
}

// 캔버스 너비 슬라이더 이벤트
canvasWidthSlider.addEventListener('input', () => {
  const width = parseInt(canvasWidthSlider.value);
  currentCanvasWidth = width;
  canvasWidthValue.textContent = width.toString();
  updateCanvasSize(width, currentCanvasHeight);
});

// 캔버스 높이 슬라이더 이벤트
canvasHeightSlider.addEventListener('input', () => {
  const height = parseInt(canvasHeightSlider.value);
  currentCanvasHeight = height;
  canvasHeightValue.textContent = height.toString();
  updateCanvasSize(currentCanvasWidth, height);
});

// URL에서 상태 복원 (페이지 로드 시)
const hasStateFromURL = loadStateFromURL();

// UI 요소에 복원된 상태 적용
function applyStateToUI(): void {
  pixelSizeSlider.value = currentMosaicSize.toString();
  pixelSizeValue.textContent = currentMosaicSize.toString();
  noiseIntensitySlider.value = (currentNoiseIntensity * 100).toString();
  noiseIntensityValue.textContent = currentNoiseIntensity.toFixed(2);
  noiseFPSSlider.value = currentNoiseFPS.toString();
  noiseFPSValue.textContent = currentNoiseFPS.toString();
  cellCountSlider.value = currentCellCount.toString();
  cellCountValue.textContent = currentCellCount.toString();
  setCountSlider.value = currentSetCount.toString();
  setCountValue.textContent = currentSetCount.toString();
  setSelectionModeSelect.value = currentSetSelectionMode;
  offsetRowRadiusContainer.style.display = currentSetSelectionMode === 'offsetRow' ? 'flex' : 'none';
  offsetRowRadiusSlider.value = currentOffsetRowRadius.toString();
  offsetRowRadiusValue.textContent = currentOffsetRowRadius.toString();
  avoidCheckbox.checked = currentAvoid;
  avoidRadiusSlider.value = currentAvoidRadius.toString();
  avoidRadiusValue.textContent = currentAvoidRadius.toString();
  avoidStrengthSlider.value = currentAvoidStrength.toString();
  avoidStrengthValue.textContent = currentAvoidStrength.toString();
  adjustCellOrderCheckbox.checked = currentAdjustCellOrder;
  adjustCellOrderContainer.style.display = currentAvoid ? 'flex' : 'none';
  shapeSelect.value = currentShape;
  sphereRadiusSlider.value = currentRadius.toString();
  sphereRadiusValue.textContent = currentRadius.toFixed(1);
  cubeSizeSlider.value = currentCubeSize.toString();
  cubeSizeValue.textContent = currentCubeSize.toFixed(1);
  planeWidthSlider.value = currentPlaneWidth.toString();
  planeWidthValue.textContent = currentPlaneWidth.toFixed(1);
  planeHeightSlider.value = currentPlaneHeight.toString();
  planeHeightValue.textContent = currentPlaneHeight.toFixed(1);
  scaleSlider.value = currentScale.toString();
  scaleValue.textContent = currentScale.toFixed(1);
  textureSelect.value = currentEarthTextureUrl;
  const texOpt = textureSelect.options[textureSelect.selectedIndex];
  currentTextureType = texOpt?.getAttribute('data-texture-type') === 'video' ? 'video' : 'image';
  controlModeSelect.value = currentControlMode;
  tiltInvertX.checked = currentTiltInvertX;
  tiltInvertY.checked = currentTiltInvertY;
  tiltMaxAngleSlider.value = currentTiltMaxAngle.toString();
  tiltMaxAngleValue.textContent = currentTiltMaxAngle.toString();
  tiltSmoothnessSlider.value = currentTiltSmoothness.toString();
  tiltSmoothnessValue.textContent = currentTiltSmoothness.toFixed(2);
  canvasWidthSlider.value = currentCanvasWidth.toString();
  canvasWidthValue.textContent = currentCanvasWidth.toString();
  canvasHeightSlider.value = currentCanvasHeight.toString();
  canvasHeightValue.textContent = currentCanvasHeight.toString();
  realTimeCodeToggle.checked = realTimeCodeGen;
  generateHtmlBtn.style.display = realTimeCodeGen ? 'none' : 'inline-block';
  backgroundColorInput.value = currentBackgroundColor;
  canvasContainer.style.backgroundColor = currentBackgroundColor;
  updateCameraControls();
}

// 초기 슬라이더 값 표시 업데이트
applyStateToUI();

// 초기 캔버스 크기 설정
updateCanvasSize(currentCanvasWidth, currentCanvasHeight);

// 리소스 로드 후 애니메이션 시작 및 상태 적용
loadResourceList().then(async () => {
  // URL에서 복원된 상태가 있으면 적용
  if (hasStateFromURL) {
    showShapeParams(currentShape);
    await applyModel();
    
    // 컨트롤 모드 적용
    if (currentControlMode === 'orbit') {
      mosaic.disableTiltControls();
      mosaic.setupOrbitControls({
        minDistance: 3,
        maxDistance: 10,
        rotateSpeed: 1.0,
        zoomSpeed: 0.1,
      });
      
      // 카메라 상태 복원
      const restoreCameraState = (window as any).__restoreCameraState;
      if (restoreCameraState) {
        const orbitControls = mosaic.getOrbitControls();
        if (orbitControls) {
          const target = new THREE.Vector3(
            restoreCameraState.target.x,
            restoreCameraState.target.y,
            restoreCameraState.target.z
          );
          orbitControls.setCameraState(
            target,
            restoreCameraState.distance,
            restoreCameraState.theta,
            restoreCameraState.phi
          );
        }
        delete (window as any).__restoreCameraState;
      }
      updateCameraControls();
    } else if (currentControlMode === 'tilt') {
      const maxAngleRad = (currentTiltMaxAngle * Math.PI) / 180;
      mosaic.setupTiltControls(currentTiltInvertX, currentTiltInvertY, maxAngleRad, currentTiltSmoothness);
      tiltInvertContainer.style.display = 'flex';
      tiltSettingsContainer.style.display = 'block';
      updateCameraControls();
    } else {
      mosaic.disableTiltControls();
      const orbitControls = mosaic.getOrbitControls();
      if (orbitControls) {
        orbitControls.dispose();
      }
      updateCameraControls();
    }
    
    // ASCII 필터 상태 복원
    if (currentMosaicSize || currentCellUrl) {
      await mosaic.enableAsciiMosaicFilter(getMosaicFilterOptions());
      asciiToggleBtn.textContent = 'ASCII 필터 끄기';
      asciiToggleBtn.style.background = '#28a745';
      pixelSizeContainer.style.display = 'flex';
      noiseIntensityContainer.style.display = 'flex';
      noiseFPSContainer.style.display = 'flex';
      cellCountContainer.style.display = 'flex';
      cellSelectContainer.style.display = 'flex';
      setConfigContainer.style.display = 'block';
      avoidContainer.style.display = 'flex';
      avoidRadiusContainer.style.display = currentAvoid ? 'flex' : 'none';
      avoidStrengthContainer.style.display = currentAvoid ? 'flex' : 'none';
      adjustCellOrderContainer.style.display = currentAvoid ? 'flex' : 'none';
      offsetRowRadiusContainer.style.display = currentSetSelectionMode === 'offsetRow' ? 'flex' : 'none';
      mosaic.setSetSelectionMode(currentSetSelectionMode);
      mosaic.setOffsetRowRadius(currentOffsetRowRadius);
      mosaic.setAvoid(currentAvoid);
      mosaic.setAvoidRadius(currentAvoidRadius);
      mosaic.setAvoidStrength(currentAvoidStrength);
      const filter = mosaic.getAsciiMosaicFilter();
      if (filter) {
        (filter as any).setAdjustCellOrder(currentAdjustCellOrder);
      }
    }

    updateHTMLCodeIfRealtime();
  }

  animate();
}).catch(async (err) => {
  console.warn('리소스 로드 실패:', err);
  // 에러 발생 시에도 기본 상태로 시작
  if (!hasStateFromURL) {
    showShapeParams(currentShape);
    await applyModel();
    updateHTMLCodeIfRealtime();
  }
  animate();
});
