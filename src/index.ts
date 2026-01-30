import * as THREE from 'three';
import {
  AsciiMosaicFilter,
  AsciiMosaicFilterOptions,
} from './asciiMosaicFilter';

/**
 * AscMosaic 라이브러리 메인 클래스
 */
export class AscMosaic {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.Mesh | null = null;
  private asciiMosaicFilter: AsciiMosaicFilter | null = null;
  private animationFrameId: number | null = null;
  private isAnimating: boolean = false;

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
      const width = container.clientWidth;
      const height = container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      if (this.asciiMosaicFilter) {
        this.asciiMosaicFilter.setSize(width, height);
      }
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
   * 렌더링 수행
   */
  private render(): void {
    if (this.asciiMosaicFilter && this.asciiMosaicFilter.getEnabled()) {
      // 필터 활성화 시: 씬을 RenderTarget에 렌더링 → 필터 적용
      this.asciiMosaicFilter.renderToTarget(this.scene, this.camera);
      this.asciiMosaicFilter.render();
    } else {
      // 필터 비활성화 시: 씬을 직접 메인 렌더러에 렌더링
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * 애니메이션을 시작합니다
   */
  animate(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const animate = () => {
      if (!this.isAnimating) return;

      this.animationFrameId = requestAnimationFrame(animate);

      if (this.cube) {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
      }

      this.render();
    };

    animate();
  }

  /**
   * 애니메이션을 중지합니다
   */
  stopAnimate(): void {
    this.isAnimating = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 수동으로 렌더링합니다 (애니메이션 없이)
   */
  renderOnce(): void {
    this.render();
  }

  /**
   * ASCII 모자이크 필터를 활성화합니다
   */
  async enableAsciiMosaicFilter(
    options?: AsciiMosaicFilterOptions
  ): Promise<void> {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.disable();
      this.asciiMosaicFilter.dispose();
    }

    const width = this.renderer.domElement.width;
    const height = this.renderer.domElement.height;

    this.asciiMosaicFilter = new AsciiMosaicFilter(
      this.renderer,
      width,
      height,
      options
    );

    // 아틀라스가 로드될 때까지 대기
    await new Promise<void>((resolve) => {
      const checkReady = () => {
        if (this.asciiMosaicFilter && this.asciiMosaicFilter.isReady()) {
          resolve();
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    });

    this.asciiMosaicFilter.enable();
  }

  /**
   * ASCII 모자이크 필터를 비활성화합니다
   */
  disableAsciiMosaicFilter(): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.disable();
    }
  }

  /**
   * ASCII 모자이크 필터를 토글합니다
   */
  async toggleAsciiMosaicFilter(
    options?: AsciiMosaicFilterOptions
  ): Promise<void> {
    if (this.isAsciiMosaicFilterEnabled()) {
      this.disableAsciiMosaicFilter();
    } else {
      await this.enableAsciiMosaicFilter(options);
    }
  }

  /**
   * ASCII 모자이크 필터 활성화 상태를 확인합니다
   */
  isAsciiMosaicFilterEnabled(): boolean {
    return this.asciiMosaicFilter?.getEnabled() ?? false;
  }

  /**
   * 모자이크 크기를 설정합니다
   */
  setMosaicSize(size: number): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setMosaicSize(size);
    }
  }

  /**
   * Scene 가져오기
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Camera 가져오기
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Renderer 가져오기
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * 리소스를 정리합니다
   */
  dispose(): void {
    this.stopAnimate();

    if (this.cube) {
      this.cube.geometry.dispose();
      if (this.cube.material instanceof THREE.Material) {
        this.cube.material.dispose();
      }
    }

    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.dispose();
      this.asciiMosaicFilter = null;
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

// ASCII 모자이크 필터 내보내기
export {
  AsciiMosaicFilter,
  type AsciiMosaicFilterOptions,
} from './asciiMosaicFilter';

// ASCII 아틀라스 내보내기
export {
  createAsciiAtlas,
  type AsciiAtlasOptions,
  type AsciiAtlasResult,
} from './asciiAtlas';

// Three.js를 재내보내기
export * from 'three';
