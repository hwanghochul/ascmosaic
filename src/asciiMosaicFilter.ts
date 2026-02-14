import * as THREE from 'three';

/**
 * 모자이크 셀 아틀라스 결과
 */
interface MosaicAtlasResult {
  /** 텍스처 */
  texture: THREE.Texture;
  /** 셀 개수 */
  cellCount: number;
}

/**
 * 모자이크 필터 옵션
 */
export interface AsciiMosaicFilterOptions {
  /** 모자이크 블록 크기 (픽셀 단위) */
  mosaicSize?: number;
  /** 모자이크 셀 텍스처 URL (mosaic_cell.png 이미지 아틀라스 사용) */
  mosaicCellTextureUrl?: string;
  /** 모자이크 셀 아틀라스의 셀 개수 (가로 방향, 1행 N열) */
  cellCount?: number;
  /** 배경색 (기본값: 흰색 0xffffff) */
  backgroundColor?: THREE.Color | number;
  /** 노이즈 강도 (0.0 ~ 1.0, 기본값: 0.0) */
  noiseIntensity?: number;
  /** 노이즈 업데이트 FPS (기본값: 15) */
  noiseFPS?: number;
  /** 세트(행) 개수 - 셀 이미지를 나눌 행 개수 (기본값: 1) */
  setCount?: number;
  /** 세트 선택 모드 (기본값: 'first') */
  setSelectionMode?: 'first' | 'random' | 'cycle';
}

/**
 * 모자이크 필터 클래스
 * FBO와 쉐이더를 사용하여 모자이크 셀 아틀라스를 이용한 포스트 프로세싱 효과를 적용합니다.
 */
export class AsciiMosaicFilter {
  private renderer: THREE.WebGLRenderer;
  private renderTarget: THREE.WebGLRenderTarget;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private quad!: THREE.Mesh; // 비동기 초기화
  private material!: THREE.ShaderMaterial; // 비동기 초기화
  private atlasResult!: MosaicAtlasResult; // 비동기 초기화
  private mosaicSize: number;
  private backgroundColor: THREE.Color;
  private noiseIntensity: number;
  private noiseFPS: number;
  /** 셀 이미지를 나눌 행 개수 (= setCount, 모든 셀 이미지 동일 형식) */
  private setCount: number;
  private setSelectionMode: 'first' | 'random' | 'cycle';
  private time: number = 0.0;
  private lastNoiseUpdateTime: number = 0.0;
  private isEnabled: boolean = false;

  // 버텍스 쉐이더 (전체 화면 쿼드)
  private static readonly VERTEX_SHADER = `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // 프래그먼트 쉐이더
  private static readonly FRAGMENT_SHADER = `
    uniform sampler2D tDiffuse;
    uniform sampler2D tAtlas;
    uniform float uMosaicSize;
    uniform float uCellCount;
    uniform float uRowCount;
    uniform float uSetCount;
    uniform float uSetSelectionMode;
    uniform vec2 uResolution;
    uniform vec3 uBackgroundColor;
    uniform float uNoiseIntensity;
    uniform float uTime;
    
    varying vec2 vUv;
    
    // RGB를 그레이스케일 밝기로 변환
    float rgbToBrightness(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }
    
    // 해시 함수: 2D 좌표를 기반으로 랜덤 값 생성
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    
    // 노이즈 함수: 모자이크 블록 좌표와 시간을 기반으로 노이즈 값 생성 (-1.0 ~ 1.0)
    float noise(vec2 coord, float time) {
      // 시간을 좌표에 추가하여 시간에 따라 변화하도록 함
      vec2 timeCoord = coord + vec2(time * 0.1, time * 0.15);
      float h = hash(timeCoord);
      return h * 2.0 - 1.0; // -1.0 ~ 1.0 범위로 변환
    }
    
    void main() {
      // 모자이크 블록 좌표 계산
      vec2 mosaicCoord = floor(vUv * uResolution / uMosaicSize) * uMosaicSize;
      vec2 sampleCoord = mosaicCoord / uResolution;
      
      // 원본 텍스처에서 샘플링 (블록의 첫 번째 픽셀 사용)
      vec4 color = texture2D(tDiffuse, sampleCoord);
      
      // 그레이스케일 밝기 계산 (원본 색상은 무시하고 밝기만 사용)
      float brightness = rgbToBrightness(color.rgb);
      
      // 배경 임계값 (밝기가 이 값 이상이면 배경으로 간주)
      float backgroundThreshold = 0.9;
      
      // 배경인 경우 배경색만 표시 (원본 밝기 사용)
      if (brightness >= backgroundThreshold) {
        gl_FragColor = vec4(uBackgroundColor, 1.0);
        return;
      }
      
      // 노이즈 적용: 모자이크 블록 좌표와 시간을 기반으로 노이즈 생성
      float noiseValue = noise(mosaicCoord, uTime) * uNoiseIntensity;
      float noisyBrightness = brightness + noiseValue;
      noisyBrightness = clamp(noisyBrightness, 0.0, 1.0); // 0.0 ~ 1.0 범위로 클램프
      
      // 노이즈가 적용된 밝기를 셀 인덱스로 매핑 (0 ~ cellCount-1)
      // 밝기를 반전시켜서: 밝을수록(흰색) 첫 번째 셀, 어두울수록(검은색) 마지막 셀
      float invertedBrightness = 1.0 - noisyBrightness;
      float cellIndex = floor(invertedBrightness * uCellCount);
      cellIndex = clamp(cellIndex, 0.0, uCellCount - 1.0);
      
      // 세트 선택 (행 인덱스) - 노이즈 FPS에 맞춰 시간에 따라 변경
      float selectedRow = 0.0;
      if (uSetSelectionMode < 0.5) {
        // first: 항상 첫 번째 세트
        selectedRow = 0.0;
      } else if (uSetSelectionMode < 1.5) {
        // random: 블록 좌표와 시간을 기반으로 랜덤 선택
        vec2 timeCoord = mosaicCoord + vec2(uTime * 0.1, uTime * 0.15);
        float rand = hash(timeCoord);
        selectedRow = floor(rand * uSetCount);
      } else {
        // cycle: 블록 좌표와 시간을 기반으로 순환 선택
        float blockIndex = mosaicCoord.x + mosaicCoord.y * 1000.0;
        float timeOffset = floor(uTime * 10.0); // 노이즈 FPS에 맞춰 업데이트
        selectedRow = mod(blockIndex + timeOffset, uSetCount);
      }
      selectedRow = clamp(selectedRow, 0.0, uSetCount - 1.0);
      
      // 모자이크 셀 아틀라스에서 해당 셀의 UV 좌표 계산 (가로 + 세로)
      float uMin = cellIndex / uCellCount;
      float uMax = (cellIndex + 1.0) / uCellCount;
      float vMin = selectedRow / uRowCount;
      float vMax = (selectedRow + 1.0) / uRowCount;
      
      // 모자이크 블록 내에서의 로컬 좌표 (0 ~ 1)
      vec2 localCoord = fract(vUv * uResolution / uMosaicSize);
      
      // 모자이크 셀 아틀라스에서 샘플링 (행에 따라 V 좌표 적용)
      vec2 atlasUV = vec2(mix(uMin, uMax, localCoord.x), mix(vMax, vMin, localCoord.y));
      vec4 atlasColor = texture2D(tAtlas, atlasUV);
      
      // 배경색과 atlasColor를 normal 모드로 블렌딩 (알파 블렌딩)
      vec3 finalColor = mix(uBackgroundColor, atlasColor.rgb, atlasColor.a);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    options: AsciiMosaicFilterOptions = {}
  ) {
    this.renderer = renderer;
    this.mosaicSize = options.mosaicSize ?? 8;
    this.noiseIntensity = options.noiseIntensity ?? 0.0; // 기본값: 노이즈 없음
    this.noiseFPS = options.noiseFPS ?? 15; // 기본값: 15 FPS
    this.setCount = Math.max(1, options.setCount ?? 1);
    this.setSelectionMode = options.setSelectionMode ?? 'first';
    this.lastNoiseUpdateTime = performance.now();
    
    // 배경색 설정
    if (options.backgroundColor instanceof THREE.Color) {
      this.backgroundColor = options.backgroundColor.clone();
    } else if (typeof options.backgroundColor === 'number') {
      this.backgroundColor = new THREE.Color(options.backgroundColor);
    } else {
      this.backgroundColor = new THREE.Color(0xffffff); // 기본값: 흰색
    }

    // RenderTarget 생성 (FBO)
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    // 포스트 프로세싱용 쿼드 생성
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();

    // 아틀라스 생성 또는 사용
    this.initAtlas(options).then(() => {
      // 쉐이더 머티리얼 생성
      this.material = new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: this.renderTarget.texture },
          tAtlas: { value: this.atlasResult.texture },
          uMosaicSize: { value: this.mosaicSize },
          uCellCount: { value: this.atlasResult.cellCount },
          uRowCount: { value: this.setCount },
          uSetCount: { value: this.setCount },
          uSetSelectionMode: { value: this.setSelectionMode === 'first' ? 0 : this.setSelectionMode === 'random' ? 1 : 2 },
          uResolution: { value: new THREE.Vector2(width, height) },
          uBackgroundColor: { value: this.backgroundColor },
          uNoiseIntensity: { value: this.noiseIntensity },
          uTime: { value: this.time },
        },
        vertexShader: AsciiMosaicFilter.VERTEX_SHADER,
        fragmentShader: AsciiMosaicFilter.FRAGMENT_SHADER,
        transparent: true, // 투명도 지원
      });

      this.quad = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.quad);
    });
  }

  /**
   * 모자이크 셀 아틀라스 초기화
   */
  private async initAtlas(
    options: AsciiMosaicFilterOptions
  ): Promise<void> {
    const textureUrl = options.mosaicCellTextureUrl ?? '/resource/mosaic_cell.png';
    const cellCount = options.cellCount ?? 10; // 기본값
    
    const textureLoader = new THREE.TextureLoader();
    
    const texture = textureLoader.load(
      textureUrl,
      () => {
        texture.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.warn('모자이크 셀 텍스처 로딩 실패:', error);
      }
    );

    // 텍스처 설정
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    this.atlasResult = {
      texture,
      cellCount,
    };
  }

  /**
   * 씬을 RenderTarget에 렌더링
   */
  renderToTarget(scene: THREE.Scene, camera: THREE.Camera): void {
    const oldRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(oldRenderTarget);
  }

  /**
   * 필터를 적용하여 메인 렌더러에 렌더링
   */
  render(): void {
    if (!this.material || !this.quad || !this.atlasResult) return;

    // 노이즈 FPS에 맞춰 시간 업데이트 제한
    const currentTime = performance.now();
    const timeDelta = currentTime - this.lastNoiseUpdateTime;
    const minInterval = 1000.0 / this.noiseFPS; // 밀리초 단위

    if (timeDelta >= minInterval) {
      // 시간 업데이트 (밀리초를 초로 변환)
      this.time = currentTime * 0.001;
      this.lastNoiseUpdateTime = currentTime;
      
      // 쉐이더 유니폼 업데이트
      if (this.material) {
        this.material.uniforms.uTime.value = this.time;
      }
    }

    // 쉐이더 유니폼 업데이트
    this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.material.uniforms.uMosaicSize.value = this.mosaicSize;
    this.material.uniforms.uRowCount.value = this.setCount;
    this.material.uniforms.uSetCount.value = this.setCount;
    this.material.uniforms.uSetSelectionMode.value =
      this.setSelectionMode === 'first' ? 0 : this.setSelectionMode === 'random' ? 1 : 2;

    // 포스트 프로세싱 쿼드 렌더링
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 필터가 준비되었는지 확인
   */
  isReady(): boolean {
    return !!(this.material && this.quad && this.atlasResult);
  }

  /**
   * 크기 업데이트
   */
  setSize(width: number, height: number): void {
    this.renderTarget.setSize(width, height);
    if (this.material) {
      this.material.uniforms.uResolution.value.set(width, height);
    }
  }

  /**
   * 모자이크 크기 설정
   */
  setMosaicSize(size: number): void {
    this.mosaicSize = size;
    if (this.material) {
      this.material.uniforms.uMosaicSize.value = size;
    }
  }

  /**
   * 배경색 설정
   */
  setBackgroundColor(color: THREE.Color | number): void {
    if (color instanceof THREE.Color) {
      this.backgroundColor.copy(color);
    } else {
      this.backgroundColor.setHex(color);
    }
    if (this.material) {
      this.material.uniforms.uBackgroundColor.value = this.backgroundColor;
    }
  }

  /**
   * 노이즈 강도 설정
   */
  setNoiseIntensity(intensity: number): void {
    this.noiseIntensity = Math.max(0.0, Math.min(1.0, intensity));
    if (this.material) {
      this.material.uniforms.uNoiseIntensity.value = this.noiseIntensity;
    }
  }

  /**
   * 노이즈 업데이트 FPS 설정
   */
  setNoiseFPS(fps: number): void {
    this.noiseFPS = Math.max(1.0, fps); // 최소 1 FPS
    this.lastNoiseUpdateTime = performance.now(); // 리셋하여 즉시 업데이트
  }

  /**
   * 세트(행) 개수 설정 - 셀 이미지를 나눌 행 개수
   */
  setSetCount(setCount: number): void {
    this.setCount = Math.max(1, setCount);
    if (this.material) {
      this.material.uniforms.uRowCount.value = this.setCount;
      this.material.uniforms.uSetCount.value = this.setCount;
    }
  }

  /**
   * 세트 선택 모드 설정
   */
  setSetSelectionMode(mode: 'first' | 'random' | 'cycle'): void {
    this.setSelectionMode = mode;
    if (this.material) {
      this.material.uniforms.uSetSelectionMode.value =
        mode === 'first' ? 0 : mode === 'random' ? 1 : 2;
    }
  }

  /**
   * RenderTarget 가져오기
   */
  getRenderTarget(): THREE.WebGLRenderTarget {
    return this.renderTarget;
  }

  /**
   * 필터 활성화
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * 필터 비활성화
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * 필터 상태 확인
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.quad) {
      this.quad.geometry.dispose();
      if (this.quad.material instanceof THREE.Material) {
        this.quad.material.dispose();
      }
    }
    this.renderTarget.dispose();
    if (this.atlasResult && this.atlasResult.texture) {
      this.atlasResult.texture.dispose();
    }
  }
}
