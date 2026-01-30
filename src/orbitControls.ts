import * as THREE from 'three';

/**
 * OrbitControls 옵션
 */
export interface OrbitControlsOptions {
  /** 최소 거리 */
  minDistance?: number;
  /** 최대 거리 */
  maxDistance?: number;
  /** 회전 속도 */
  rotateSpeed?: number;
  /** 줌 속도 */
  zoomSpeed?: number;
  /** 수직 각도 최소값 (라디안) */
  minPolarAngle?: number;
  /** 수직 각도 최대값 (라디안) */
  maxPolarAngle?: number;
  /** 자동 회전 활성화 */
  autoRotate?: boolean;
  /** 자동 회전 속도 */
  autoRotateSpeed?: number;
}

/**
 * 간단한 OrbitControls 구현
 * 카메라를 타겟 주위에서 회전하고 줌할 수 있게 합니다.
 */
export class OrbitControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3;

  // 옵션
  private minDistance: number;
  private maxDistance: number;
  private rotateSpeed: number;
  private zoomSpeed: number;
  private minPolarAngle: number;
  private maxPolarAngle: number;
  private autoRotate: boolean;
  private autoRotateSpeed: number;

  // 상태
  private isMouseDown: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private theta: number = 0; // 수평 각도
  private phi: number = Math.PI / 2; // 수직 각도 (0 = 위, π = 아래)
  private distance: number = 5;

  // 이벤트 핸들러 바인딩
  private onMouseDownHandler: (event: MouseEvent) => void;
  private onMouseMoveHandler: (event: MouseEvent) => void;
  private onMouseUpHandler: () => void;
  private onWheelHandler: (event: WheelEvent) => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    options: OrbitControlsOptions = {}
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);

    // 옵션 설정
    this.minDistance = options.minDistance ?? 2;
    this.maxDistance = options.maxDistance ?? 10;
    this.rotateSpeed = options.rotateSpeed ?? 1.0;
    this.zoomSpeed = options.zoomSpeed ?? 0.1;
    this.minPolarAngle = options.minPolarAngle ?? Math.PI / 6; // 30도
    this.maxPolarAngle = options.maxPolarAngle ?? (5 * Math.PI) / 6; // 150도
    this.autoRotate = options.autoRotate ?? false;
    this.autoRotateSpeed = options.autoRotateSpeed ?? 1.0;

    // 초기 카메라 위치에서 각도 계산
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.target)
      .normalize();
    this.distance = this.camera.position.distanceTo(this.target);
    this.theta = Math.atan2(direction.x, direction.z);
    this.phi = Math.acos(direction.y);

    // 이벤트 핸들러 바인딩
    this.onMouseDownHandler = this.onMouseDown.bind(this);
    this.onMouseMoveHandler = this.onMouseMove.bind(this);
    this.onMouseUpHandler = this.onMouseUp.bind(this);
    this.onWheelHandler = this.onWheel.bind(this);

    // 이벤트 리스너 등록
    this.domElement.addEventListener('mousedown', this.onMouseDownHandler);
    this.domElement.addEventListener('mousemove', this.onMouseMoveHandler);
    this.domElement.addEventListener('mouseup', this.onMouseUpHandler);
    this.domElement.addEventListener('mouseleave', this.onMouseUpHandler);
    this.domElement.addEventListener('wheel', this.onWheelHandler);

    // 초기 카메라 위치 업데이트
    this.updateCamera();
  }

  /**
   * 마우스 다운 이벤트
   */
  private onMouseDown(event: MouseEvent): void {
    this.isMouseDown = true;
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    this.domElement.style.cursor = 'grabbing';
  }

  /**
   * 마우스 이동 이벤트
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isMouseDown) return;

    const deltaX = event.clientX - this.mouseX;
    const deltaY = event.clientY - this.mouseY;

    // 수평 회전 (theta)
    this.theta -= (deltaX * this.rotateSpeed * 0.01);

    // 수직 회전 (phi)
    this.phi += (deltaY * this.rotateSpeed * 0.01);
    this.phi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.phi)
    );

    this.mouseX = event.clientX;
    this.mouseY = event.clientY;

    this.updateCamera();
  }

  /**
   * 마우스 업 이벤트
   */
  private onMouseUp(): void {
    this.isMouseDown = false;
    this.domElement.style.cursor = 'grab';
  }

  /**
   * 휠 이벤트 (줌)
   */
  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY > 0 ? 1 : -1;
    this.distance += delta * this.zoomSpeed;
    this.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.distance)
    );

    this.updateCamera();
  }

  /**
   * 카메라 위치 업데이트
   */
  private updateCamera(): void {
    // 스피어 좌표계에서 카메라 위치 계산
    const x =
      this.distance * Math.sin(this.phi) * Math.cos(this.theta);
    const y = this.distance * Math.cos(this.phi);
    const z =
      this.distance * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.position.set(
      this.target.x + x,
      this.target.y + y,
      this.target.z + z
    );
    this.camera.lookAt(this.target);
  }

  /**
   * 자동 회전 업데이트
   */
  update(): void {
    if (this.autoRotate) {
      this.theta += this.autoRotateSpeed * 0.01;
      this.updateCamera();
    }
  }

  /**
   * 타겟 설정
   */
  setTarget(target: THREE.Vector3): void {
    this.target.copy(target);
    this.updateCamera();
  }

  /**
   * 거리 설정
   */
  setDistance(distance: number): void {
    this.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, distance)
    );
    this.updateCamera();
  }

  /**
   * 자동 회전 설정
   */
  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDownHandler);
    this.domElement.removeEventListener('mousemove', this.onMouseMoveHandler);
    this.domElement.removeEventListener('mouseup', this.onMouseUpHandler);
    this.domElement.removeEventListener('mouseleave', this.onMouseUpHandler);
    this.domElement.removeEventListener('wheel', this.onWheelHandler);
    this.domElement.style.cursor = '';
  }
}
