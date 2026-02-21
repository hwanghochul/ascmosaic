import * as THREE from 'three';
import {
  AsciiMosaicFilter,
  AsciiMosaicFilterOptions,
} from './asciiMosaicFilter';
import { createTexturedMesh, TexturedMeshOptions } from './texturedMesh';
import { OrbitControls, OrbitControlsOptions } from './orbitControls';

/**
 * AscMosaic 라이브러리 메인 클래스
 */
export class AscMosaic {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.Mesh | null = null;
  private model: THREE.Object3D | null = null;
  private modelOptions: TexturedMeshOptions | null = null;
  private orbitControls: OrbitControls | null = null;
  private tiltControlsEnabled: boolean = false;
  private tiltMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private tiltMouseLeaveHandler: (() => void) | null = null;
  private tiltResetAnimationId: number | null = null;
  private tiltTargetRotationX: number = 0;
  private tiltTargetRotationY: number = 0;
  private tiltAnimationId: number | null = null;
  private tiltMaxAngle: number = Math.PI / 6; // 기본값: 30도
  private tiltSmoothness: number = 0.15; // 기본값: 0.15 (lerp factor)
  private container: HTMLElement;
  private asciiMosaicFilter: AsciiMosaicFilter | null = null;
  private animationFrameId: number | null = null;
  private isAnimating: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff); // 흰색 배경

    // Camera 생성
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer 생성
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true, // 알파 채널 지원
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    // 색상이 정확하게 보이도록 tone mapping 설정
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 2.0;
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

  async addModel(options?: TexturedMeshOptions): Promise<THREE.Object3D> {
    const opts = options ?? {};
    const newShape = opts.shape ?? 'sphere';
    const newScale = opts.scale ?? 1;

    // 기존 모델이 있고 같은 shape인 경우
    if (this.model && this.modelOptions && this.modelOptions.shape === newShape) {
      const oldScale = this.modelOptions.scale ?? 1;
      const textureChanged = 
        this.modelOptions.textureUrl !== opts.textureUrl ||
        this.modelOptions.textureType !== opts.textureType ||
        this.modelOptions.modelUrl !== opts.modelUrl;
      
      const geometryChanged = 
        this.modelOptions.radius !== opts.radius ||
        this.modelOptions.size !== opts.size ||
        this.modelOptions.width !== opts.width ||
        this.modelOptions.height !== opts.height;

      // 텍스처가 변경되지 않고 geometry만 변경된 경우: geometry만 교체
      if (!textureChanged && geometryChanged && newShape !== 'glb') {
        this.model.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.geometry) {
            const oldGeometry = obj.geometry;
            // 새 geometry 생성
            const radius = opts.radius ?? 2;
            const widthSegments = opts.widthSegments ?? 64;
            const heightSegments = opts.heightSegments ?? 32;
            const size = opts.size ?? 4;
            const width = opts.width ?? 4;
            const height = opts.height ?? 4;

            let newGeometry: THREE.BufferGeometry;
            switch (newShape) {
              case 'sphere':
                newGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
                break;
              case 'cube':
                newGeometry = new THREE.BoxGeometry(size, size, size);
                break;
              case 'plane':
                newGeometry = new THREE.PlaneGeometry(width, height);
                break;
              default:
                newGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
            }
            
            // geometry 교체 및 material side 속성 업데이트
            obj.geometry = newGeometry;
            if (obj.material instanceof THREE.MeshBasicMaterial) {
              obj.material.side = newShape === 'plane' ? THREE.DoubleSide : THREE.FrontSide;
            }
            oldGeometry.dispose();
          }
        });
        // scale 업데이트
        this.model.scale.setScalar(newScale);
        this.modelOptions = { ...opts };
        return this.model;
      }

      // scale만 변경된 경우: scale만 업데이트
      if (!textureChanged && !geometryChanged && oldScale !== newScale) {
        this.model.scale.setScalar(newScale);
        this.modelOptions = { ...opts };
        return this.model;
      }
    }

    // shape가 변경되었거나 텍스처가 변경된 경우: 새로 생성
    if (this.model) {
      this.scene.remove(this.model);
      this.model.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (obj.material instanceof THREE.Material) {
            if (obj.material instanceof THREE.MeshBasicMaterial && obj.material.map instanceof THREE.VideoTexture) {
              const videoTexture = obj.material.map as THREE.VideoTexture;
              const video = videoTexture.image as HTMLVideoElement;
              if (video) {
                video.pause();
                video.src = '';
                video.load();
              }
              videoTexture.dispose();
            }
            obj.material.dispose();
          }
        }
      });
      this.model = null;
    }

    this.model = await createTexturedMesh(opts);
    this.scene.add(this.model);
    this.modelOptions = { ...opts };

    // 모델의 bounding box를 계산하여 카메라 위치 조정
    if (this.model) {
      const box = new THREE.Box3().setFromObject(this.model);
      if (!box.isEmpty()) {
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // 평면의 경우 높이를 고려하여 거리 계산
        let distance: number;
        if (opts.shape === 'plane') {
          // 평면은 주로 XY 평면이므로 Z축 방향에서 봐야 함
          // 평면의 대각선 길이를 기준으로 거리 계산
          const diagonal = Math.sqrt(size.x * size.x + size.y * size.y);
          distance = Math.max(diagonal * 1.5, 5);
          // Z축 방향에서 약간 위에서 보도록
          this.camera.position.set(center.x, center.y + distance * 0.3, center.z + distance);
        } else {
          // 구, 큐브, GLB의 경우
          distance = Math.max(maxDim * 3, 5);
          this.camera.position.set(center.x, center.y, center.z + distance);
        }
        
        this.camera.lookAt(center);
        this.camera.updateProjectionMatrix();
      } else {
        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);
      }
    } else {
      this.camera.position.set(0, 0, 5);
      this.camera.lookAt(0, 0, 0);
    }

    return this.model;
  }

  /**
   * OrbitControls를 설정합니다
   */
  setupOrbitControls(options?: OrbitControlsOptions): OrbitControls {
    // 기존 컨트롤 제거
    if (this.orbitControls) {
      this.orbitControls.dispose();
    }

    // 모델이 있으면 모델의 중심을 타겟으로 설정
    let target: THREE.Vector3 | undefined;
    if (this.model) {
      const box = new THREE.Box3().setFromObject(this.model);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        target = center;
      }
    }

    // 옵션에 타겟 추가
    const orbitOptions: OrbitControlsOptions = {
      ...options,
      target: target || options?.target,
    };

    // 새 컨트롤 생성
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
      orbitOptions
    );

    return this.orbitControls;
  }

  /**
   * 기울임 컨트롤을 설정합니다 (마우스 위치에 따라 모델이 기울어짐)
   * @param invertX X축 반전 여부
   * @param invertY Y축 반전 여부
   * @param maxTiltAngle 최대 기울임 각도 (라디안, 기본값: Math.PI / 6 = 30도)
   * @param smoothness 스무스 속도 (0~1, 값이 클수록 빠름, 기본값: 0.15)
   */
  setupTiltControls(
    invertX: boolean = false, 
    invertY: boolean = false,
    maxTiltAngle: number = Math.PI / 6,
    smoothness: number = 0.15
  ): void {
    // 기존 컨트롤 제거
    if (this.orbitControls) {
      this.orbitControls.dispose();
      this.orbitControls = null;
    }
    this.disableTiltControls(); // 기존 이벤트 리스너 제거

    this.tiltControlsEnabled = true;
    this.tiltMaxAngle = maxTiltAngle;
    this.tiltSmoothness = Math.max(0.01, Math.min(1, smoothness)); // 0.01~1 사이로 제한
    
    // 목표 rotation 초기화
    this.tiltTargetRotationX = 0;
    this.tiltTargetRotationY = 0;
    if (this.model) {
      this.model.rotation.x = 0;
      this.model.rotation.y = 0;
    }

    // 애니메이션 루프 (목표 rotation으로 부드럽게 전환)
    const animateToTarget = () => {
      if (!this.model || !this.tiltControlsEnabled) {
        this.tiltAnimationId = null;
        return;
      }

      const currentX = this.model.rotation.x;
      const currentY = this.model.rotation.y;
      const targetX = this.tiltTargetRotationX;
      const targetY = this.tiltTargetRotationY;
      
      // 부드러운 전환 (lerp) - 설정된 smoothness 사용
      const newX = currentX + (targetX - currentX) * this.tiltSmoothness;
      const newY = currentY + (targetY - currentY) * this.tiltSmoothness;
      
      // 거의 목표에 도달했으면 정확히 설정
      if (Math.abs(newX - targetX) < 0.001 && Math.abs(newY - targetY) < 0.001) {
        this.model.rotation.x = targetX;
        this.model.rotation.y = targetY;
        this.tiltAnimationId = null;
      } else {
        this.model.rotation.x = newX;
        this.model.rotation.y = newY;
        this.tiltAnimationId = requestAnimationFrame(animateToTarget);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.tiltControlsEnabled || !this.model) return;

      // 마우스가 다시 들어오면 리셋 애니메이션 취소
      if (this.tiltResetAnimationId !== null) {
        cancelAnimationFrame(this.tiltResetAnimationId);
        this.tiltResetAnimationId = null;
      }

      const rect = this.container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      // 중심에서의 거리 (정규화: -1 ~ 1)
      const maxDistance = Math.min(rect.width, rect.height) / 2;
      let normalizedX = Math.max(-1, Math.min(1, mouseX / maxDistance));
      let normalizedY = Math.max(-1, Math.min(1, -mouseY / maxDistance)); // Y는 반전 (위쪽이 양수)
      
      // 반전 옵션 적용
      if (invertX) normalizedX = -normalizedX;
      if (invertY) normalizedY = -normalizedY;
      
      // 목표 기울임 각도 설정
      this.tiltTargetRotationY = -normalizedX * this.tiltMaxAngle; // 오른쪽이면 Y축으로 반대 방향 회전
      this.tiltTargetRotationX = normalizedY * this.tiltMaxAngle; // 위쪽이면 위로 기울임
      
      // 애니메이션 시작 (이미 실행 중이면 계속 실행)
      if (this.tiltAnimationId === null) {
        this.tiltAnimationId = requestAnimationFrame(animateToTarget);
      }
    };

    const handleMouseLeave = () => {
      if (!this.model) return;
      
      // 기존 리셋 애니메이션 취소 (이제 사용하지 않음)
      if (this.tiltResetAnimationId !== null) {
        cancelAnimationFrame(this.tiltResetAnimationId);
        this.tiltResetAnimationId = null;
      }
      
      // 목표 rotation을 0으로 설정하고 기존 애니메이션 루프 사용
      this.tiltTargetRotationX = 0;
      this.tiltTargetRotationY = 0;
      
      // 애니메이션 루프 시작 (이미 실행 중이면 계속 실행)
      if (this.tiltAnimationId === null) {
        this.tiltAnimationId = requestAnimationFrame(animateToTarget);
      }
    };

    this.tiltMouseMoveHandler = handleMouseMove;
    this.tiltMouseLeaveHandler = handleMouseLeave;
    this.container.addEventListener('mousemove', handleMouseMove);
    this.container.addEventListener('mouseleave', handleMouseLeave);
  }

  /**
   * 기울임 컨트롤을 비활성화합니다
   */
  disableTiltControls(): void {
    this.tiltControlsEnabled = false;
    
    // 애니메이션 취소
    if (this.tiltResetAnimationId !== null) {
      cancelAnimationFrame(this.tiltResetAnimationId);
      this.tiltResetAnimationId = null;
    }
    if (this.tiltAnimationId !== null) {
      cancelAnimationFrame(this.tiltAnimationId);
      this.tiltAnimationId = null;
    }
    
    // 목표 rotation 초기화
    this.tiltTargetRotationX = 0;
    this.tiltTargetRotationY = 0;
    
    if (this.tiltMouseMoveHandler) {
      this.container.removeEventListener('mousemove', this.tiltMouseMoveHandler);
      this.tiltMouseMoveHandler = null;
    }
    if (this.tiltMouseLeaveHandler) {
      this.container.removeEventListener('mouseleave', this.tiltMouseLeaveHandler);
      this.tiltMouseLeaveHandler = null;
    }
  }

  /**
   * 조명을 추가합니다 (모델의 고유색이 잘 보이도록 Ambient Light만 사용)
   */
  addLights(): void {
    // Ambient Light만 사용하여 모델의 고유색이 균일하게 보이도록 설정
    // intensity를 높여서 색상이 밝게 보이도록 함
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
    this.scene.add(ambientLight);
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

      // 모델 자동 회전
      if (this.model) {
        this.model.rotation.y += 0.005; // Y축 기준 회전
      }

      // OrbitControls 업데이트
      if (this.orbitControls) {
        this.orbitControls.update();
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
   * 노이즈 강도를 설정합니다
   */
  setNoiseIntensity(intensity: number): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setNoiseIntensity(intensity);
    }
  }

  /**
   * 노이즈 업데이트 FPS를 설정합니다
   */
  setNoiseFPS(fps: number): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setNoiseFPS(fps);
    }
  }

  /**
   * 모자이크 세트 개수를 설정합니다
   */
  setSetCount(setCount: number): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setSetCount(setCount);
    }
  }

  /**
   * 모자이크 세트 선택 모드를 설정합니다
   */
  setSetSelectionMode(mode: 'first' | 'random' | 'cycle'): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setSetSelectionMode(mode);
    }
  }

  /**
   * 셀 마우스 회피 기능 on/off
   */
  setAvoid(enabled: boolean): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setAvoid(enabled);
    }
  }

  /**
   * 마우스 영향 범위(픽셀) 설정
   */
  setAvoidRadius(radius: number): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setAvoidRadius(radius);
    }
  }

  /**
   * 셀 이동 강도 설정
   */
  setAvoidStrength(strength: number): void {
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setAvoidStrength(strength);
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
   * 캔버스 크기 설정
   */
  setCanvasSize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.asciiMosaicFilter) {
      this.asciiMosaicFilter.setSize(width, height);
    }
  }

  /**
   * OrbitControls 가져오기
   */
  getOrbitControls(): OrbitControls | null {
    return this.orbitControls;
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

    if (this.model) {
      this.model.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (obj.material instanceof THREE.Material) {
            if (obj.material instanceof THREE.MeshBasicMaterial && obj.material.map instanceof THREE.VideoTexture) {
              const videoTexture = obj.material.map as THREE.VideoTexture;
              const video = videoTexture.image as HTMLVideoElement;
              if (video) {
                video.pause();
                video.src = '';
                video.load();
              }
              videoTexture.dispose();
            }
            obj.material.dispose();
          }
        }
      });
    }

    if (this.orbitControls) {
      this.orbitControls.dispose();
      this.orbitControls = null;
    }

    this.disableTiltControls();

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

// 지구본 내보내기
export {
  createTexturedMesh,
  createTexturedMesh as createEarth,
  type TexturedMeshOptions,
  type TexturedMeshOptions as EarthOptions,
  type TexturedMeshShape,
} from './texturedMesh';

// OrbitControls 내보내기
export { OrbitControls, type OrbitControlsOptions } from './orbitControls';

// Three.js를 재내보내기
export * from 'three';
