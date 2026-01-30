import { AscMosaic, createCube, createSphere } from '../src/index';
import * as THREE from 'three';

// DOM 요소 가져오기
const canvasContainer = document.getElementById('canvas-container')!;
const addCubeBtn = document.getElementById('add-cube-btn')!;
const addSphereBtn = document.getElementById('add-sphere-btn')!;
const clearBtn = document.getElementById('clear-btn')!;
const asciiToggleBtn = document.getElementById('ascii-toggle-btn')!;

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

// ASCII 필터 토글 버튼
asciiToggleBtn.addEventListener('click', async () => {
  try {
    await mosaic.toggleAsciiMosaicFilter({
      mosaicSize: 16, // 모자이크 블록 크기
      charset: ' .,:;+=xX$&@#', // ASCII 문자 세트
    });

    // 버튼 텍스트 업데이트
    if (mosaic.isAsciiMosaicFilterEnabled()) {
      asciiToggleBtn.textContent = 'ASCII 필터 끄기';
      asciiToggleBtn.style.background = '#28a745';
    } else {
      asciiToggleBtn.textContent = 'ASCII 필터 토글';
      asciiToggleBtn.style.background = '#667eea';
    }
  } catch (error) {
    console.error('ASCII 필터 토글 오류:', error);
  }
});

// 애니메이션 시작
animate();

// 초기 큐브 추가
mosaic.addCube();
mosaic.animate();
