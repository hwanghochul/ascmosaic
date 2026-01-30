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
    uniform vec2 uResolution;
    uniform vec3 uBackgroundColor;
    
    varying vec2 vUv;
    
    // RGB를 그레이스케일 밝기로 변환
    float rgbToBrightness(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
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
      
      // 배경인 경우 배경색만 표시
      if (brightness >= backgroundThreshold) {
        gl_FragColor = vec4(uBackgroundColor, 1.0);
        return;
      }
      
      // 밝기를 셀 인덱스로 매핑 (0 ~ cellCount-1)
      // 밝기를 반전시켜서: 밝을수록(흰색) 첫 번째 셀, 어두울수록(검은색) 마지막 셀
      float invertedBrightness = 1.0 - brightness;
      float cellIndex = floor(invertedBrightness * uCellCount);
      cellIndex = clamp(cellIndex, 0.0, uCellCount - 1.0);
      
      // 모자이크 셀 아틀라스에서 해당 셀의 UV 좌표 계산 (가로 방향)
      float uMin = cellIndex / uCellCount;
      float uMax = (cellIndex + 1.0) / uCellCount;
      
      // 모자이크 블록 내에서의 로컬 좌표 (0 ~ 1)
      vec2 localCoord = fract(vUv * uResolution / uMosaicSize);
      
      // 모자이크 셀 아틀라스에서 샘플링
      vec2 atlasUV = vec2(mix(uMin, uMax, localCoord.x), 1.0 - localCoord.y);
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
          uResolution: { value: new THREE.Vector2(width, height) },
          uBackgroundColor: { value: this.backgroundColor },
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
    const textureUrl = options.mosaicCellTextureUrl ?? '/textures/mosaic_cell.png';
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

    // 쉐이더 유니폼 업데이트
    this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.material.uniforms.uMosaicSize.value = this.mosaicSize;

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
