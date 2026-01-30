import * as THREE from 'three';

/**
 * AscMosaic 라이브러리 메인 클래스
 */
export class AscMosaic {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.Mesh | null = null;

  constructor(container: HTMLElement) {
    // Scene 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    // Camera 생성
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer 생성
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 리사이즈 핸들러
    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  /**
   * 큐브를 추가합니다
   */
  addCube(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  /**
   * 애니메이션을 시작합니다
   */
  animate(): void {
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.cube) {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * 리소스를 정리합니다
   */
  dispose(): void {
    if (this.cube) {
      this.cube.geometry.dispose();
      if (this.cube.material instanceof THREE.Material) {
        this.cube.material.dispose();
      }
    }
    this.renderer.dispose();
  }
}

// 유틸리티 함수들
export const createCube = (size: number = 1, color: number = 0x00ff00): THREE.Mesh => {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
};

export const createSphere = (radius: number = 1, color: number = 0xff0000): THREE.Mesh => {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
};

// Three.js를 재내보내기
export * from 'three';
