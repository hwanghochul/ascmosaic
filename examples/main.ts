import { AscMosaic, createCube, createSphere } from '../src/index';
import * as THREE from 'three';

// DOM 요소 가져오기
const canvasContainer = document.getElementById('canvas-container')!;
const addCubeBtn = document.getElementById('add-cube-btn')!;
const addSphereBtn = document.getElementById('add-sphere-btn')!;
const clearBtn = document.getElementById('clear-btn')!;

// AscMosaic 인스턴스 생성
const mosaic = new AscMosaic(canvasContainer);

// Scene에 직접 접근하기 위해 (예제용)
const scene = (mosaic as any).scene as THREE.Scene;
const camera = (mosaic as any).camera as THREE.PerspectiveCamera;
const renderer = (mosaic as any).renderer as THREE.WebGLRenderer;

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

  renderer.render(scene, camera);
}

// 애니메이션 시작
animate();

// 초기 큐브 추가
mosaic.addCube();
mosaic.animate();
