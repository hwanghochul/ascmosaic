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
 * InstancedMesh로 각 모자이크 셀을 하나의 평면으로 렌더링합니다.
 */
export class AsciiMosaicFilter {
  private renderer: THREE.WebGLRenderer;
  private renderTarget: THREE.WebGLRenderTarget;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private atlasResult!: MosaicAtlasResult;
  private mosaicSize: number;
  private backgroundColor: THREE.Color;
  private noiseIntensity: number;
  private noiseFPS: number;
  private setCount: number;
  private setSelectionMode: 'first' | 'random' | 'cycle';
  private time: number = 0.0;
  private lastNoiseUpdateTime: number = 0.0;
  private isEnabled: boolean = false;
  private width: number;
  private height: number;
  private instanceCount: number = 0;
  private maxInstanceCount: number = 0;
  private instanceSampleUVs: Float32Array | null = null;
  private planeGeometry: THREE.PlaneGeometry | null = null;

  private static readonly VERTEX_SHADER = `
    attribute vec2 instanceSampleUV;
    varying vec2 vSampleUV;
    varying vec2 vLocalUV;
    
    void main() {
      vSampleUV = instanceSampleUV;
      vLocalUV = uv;
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

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
    
    varying vec2 vSampleUV;
    varying vec2 vLocalUV;
    
    float rgbToBrightness(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }
    
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    
    float noise(vec2 coord, float time) {
      vec2 timeCoord = coord + vec2(time * 0.1, time * 0.15);
      float h = hash(timeCoord);
      return h * 2.0 - 1.0;
    }
    
    void main() {
      vec2 sampleCoord = vSampleUV;
      vec4 color = texture2D(tDiffuse, sampleCoord);
      float brightness = rgbToBrightness(color.rgb);
      float backgroundThreshold = 0.9;
      
      if (brightness >= backgroundThreshold) {
        gl_FragColor = vec4(uBackgroundColor, 1.0);
        return;
      }
      
      vec2 mosaicCoord = floor(vSampleUV * uResolution / uMosaicSize) * uMosaicSize;
      float noiseValue = noise(mosaicCoord, uTime) * uNoiseIntensity;
      float noisyBrightness = brightness + noiseValue;
      noisyBrightness = clamp(noisyBrightness, 0.0, 1.0);
      
      float invertedBrightness = 1.0 - noisyBrightness;
      float cellIndex = floor(invertedBrightness * uCellCount);
      cellIndex = clamp(cellIndex, 0.0, uCellCount - 1.0);
      
      float selectedRow = 0.0;
      if (uSetSelectionMode < 0.5) {
        selectedRow = 0.0;
      } else if (uSetSelectionMode < 1.5) {
        vec2 timeCoord = mosaicCoord + vec2(uTime * 0.1, uTime * 0.15);
        float rand = hash(timeCoord);
        selectedRow = floor(rand * uSetCount);
      } else {
        float blockIndex = mosaicCoord.x + mosaicCoord.y * 1000.0;
        float timeOffset = floor(uTime * 10.0);
        selectedRow = mod(blockIndex + timeOffset, uSetCount);
      }
      selectedRow = clamp(selectedRow, 0.0, uSetCount - 1.0);
      
      float uMin = cellIndex / uCellCount;
      float uMax = (cellIndex + 1.0) / uCellCount;
      float vMin = selectedRow / uRowCount;
      float vMax = (selectedRow + 1.0) / uRowCount;
      
      vec2 atlasUV = vec2(mix(uMin, uMax, vLocalUV.x), mix(vMax, vMin, vLocalUV.y));
      vec4 atlasColor = texture2D(tAtlas, atlasUV);
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
    this.width = width;
    this.height = height;
    this.mosaicSize = options.mosaicSize ?? 8;
    this.noiseIntensity = options.noiseIntensity ?? 0.0;
    this.noiseFPS = options.noiseFPS ?? 15;
    this.setCount = Math.max(1, options.setCount ?? 1);
    this.setSelectionMode = options.setSelectionMode ?? 'first';
    this.lastNoiseUpdateTime = performance.now();

    if (options.backgroundColor instanceof THREE.Color) {
      this.backgroundColor = options.backgroundColor.clone();
    } else if (typeof options.backgroundColor === 'number') {
      this.backgroundColor = new THREE.Color(options.backgroundColor);
    } else {
      this.backgroundColor = new THREE.Color(0xffffff);
    }

    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();

    this.initAtlas(options).then(() => {
      this.buildInstancedMesh(width, height);
    });
  }

  private async initAtlas(
    options: AsciiMosaicFilterOptions
  ): Promise<void> {
    const textureUrl = options.mosaicCellTextureUrl ?? '/resource/mosaic_cell.png';
    const cellCount = options.cellCount ?? 10;
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
      textureUrl,
      () => { texture.needsUpdate = true; },
      undefined,
      (error) => { console.warn('모자이크 셀 텍스처 로딩 실패:', error); }
    );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.atlasResult = { texture, cellCount };
  }

  private getInstanceCount(w: number, h: number, size: number): number {
    const cols = Math.ceil(w / size);
    const rows = Math.ceil(h / size);
    return cols * rows;
  }

  private buildInstancedMesh(w: number, h: number): void {
    const size = this.mosaicSize;
    const count = this.getInstanceCount(w, h, size);
    this.maxInstanceCount = Math.max(this.maxInstanceCount, count);
    this.instanceCount = count;

    this.planeGeometry = new THREE.PlaneGeometry(1, 1);
    this.instanceSampleUVs = new Float32Array(this.maxInstanceCount * 2);

    const cols = Math.ceil(w / size);
    const rows = Math.ceil(h / size);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = j * cols + i;
        const centerX = (i * size + 0.5 * size) / w;
        const centerY = (j * size + 0.5 * size) / h;
        this.instanceSampleUVs![idx * 2] = centerX;
        this.instanceSampleUVs![idx * 2 + 1] = centerY;
      }
    }

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        tAtlas: { value: this.atlasResult.texture },
        uMosaicSize: { value: size },
        uCellCount: { value: this.atlasResult.cellCount },
        uRowCount: { value: this.setCount },
        uSetCount: { value: this.setCount },
        uSetSelectionMode: { value: this.setSelectionMode === 'first' ? 0 : this.setSelectionMode === 'random' ? 1 : 2 },
        uResolution: { value: new THREE.Vector2(w, h) },
        uBackgroundColor: { value: this.backgroundColor },
        uNoiseIntensity: { value: this.noiseIntensity },
        uTime: { value: this.time },
      },
      vertexShader: AsciiMosaicFilter.VERTEX_SHADER,
      fragmentShader: AsciiMosaicFilter.FRAGMENT_SHADER,
      transparent: true,
    });

    const geometry = this.planeGeometry.clone();
    const sampleUVAttr = new THREE.InstancedBufferAttribute(this.instanceSampleUVs!, 2);
    (sampleUVAttr as THREE.BufferAttribute).usage = THREE.DynamicDrawUsage;
    geometry.setAttribute('instanceSampleUV', sampleUVAttr);

    this.instancedMesh = new THREE.InstancedMesh(geometry, this.material, this.maxInstanceCount);
    this.instancedMesh.count = this.instanceCount;
    this.instancedMesh.frustumCulled = false;
    this.updateInstanceMatrices(w, h, size);
    this.scene.add(this.instancedMesh);
  }

  private updateInstanceMatrices(w: number, h: number, size: number): void {
    if (!this.instancedMesh) return;
    const cols = Math.ceil(w / size);
    const rows = Math.ceil(h / size);
    const scaleX = (size / w) * 2;
    const scaleY = (size / h) * 2;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(scaleX, scaleY, 1);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = j * cols + i;
        const centerX = (i * size + 0.5 * size) / w;
        const centerY = (j * size + 0.5 * size) / h;
        position.x = centerX * 2 - 1;
        position.y = centerY * 2 - 1; // 텍스처 하단(centerY=0)=화면 하단(NDC -1), 상단(centerY=1)=화면 상단(NDC 1)
        position.z = 0;
        quat.identity();
        matrix.compose(position, quat, scale);
        this.instancedMesh.setMatrixAt(idx, matrix);
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private updateInstanceSampleUVs(w: number, h: number, size: number): void {
    if (!this.instanceSampleUVs || !this.instancedMesh) return;
    const cols = Math.ceil(w / size);
    const rows = Math.ceil(h / size);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = j * cols + i;
        const centerX = (i * size + 0.5 * size) / w;
        const centerY = (j * size + 0.5 * size) / h;
        this.instanceSampleUVs[idx * 2] = centerX;
        this.instanceSampleUVs[idx * 2 + 1] = centerY;
      }
    }
    const attr = this.instancedMesh.geometry.attributes.instanceSampleUV as THREE.InstancedBufferAttribute;
    if (attr) attr.needsUpdate = true;
  }

  renderToTarget(scene: THREE.Scene, camera: THREE.Camera): void {
    const oldRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(oldRenderTarget);
  }

  render(): void {
    if (!this.material || !this.instancedMesh || !this.atlasResult) return;

    const currentTime = performance.now();
    const timeDelta = currentTime - this.lastNoiseUpdateTime;
    const minInterval = 1000.0 / this.noiseFPS;
    if (timeDelta >= minInterval) {
      this.time = currentTime * 0.001;
      this.lastNoiseUpdateTime = currentTime;
      if (this.material) this.material.uniforms.uTime.value = this.time;
    }

    this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.material.uniforms.uMosaicSize.value = this.mosaicSize;
    this.material.uniforms.uRowCount.value = this.setCount;
    this.material.uniforms.uSetCount.value = this.setCount;
    this.material.uniforms.uSetSelectionMode.value =
      this.setSelectionMode === 'first' ? 0 : this.setSelectionMode === 'random' ? 1 : 2;

    this.renderer.render(this.scene, this.camera);
  }

  isReady(): boolean {
    return !!(this.material && this.instancedMesh && this.atlasResult);
  }

  setSize(width: number, height: number): void {
    this.renderTarget.setSize(width, height);
    this.width = width;
    this.height = height;
    if (this.material) {
      this.material.uniforms.uResolution.value.set(width, height);
    }
    this.setMosaicSize(this.mosaicSize);
  }

  setMosaicSize(size: number): void {
    this.mosaicSize = size;
    const w = this.width;
    const h = this.height;
    const newCount = this.getInstanceCount(w, h, size);

    if (!this.instancedMesh) return;

    if (newCount > this.maxInstanceCount) {
      this.maxInstanceCount = newCount;
      const oldGeo = this.instancedMesh.geometry;
      this.instanceSampleUVs = new Float32Array(this.maxInstanceCount * 2);
      const cols = Math.ceil(w / size);
      const rows = Math.ceil(h / size);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i;
          const centerX = (i * size + 0.5 * size) / w;
          const centerY = (j * size + 0.5 * size) / h;
          this.instanceSampleUVs[idx * 2] = centerX;
          this.instanceSampleUVs[idx * 2 + 1] = centerY;
        }
      }
      const newGeometry = this.planeGeometry!.clone();
      const newSampleUVAttr = new THREE.InstancedBufferAttribute(this.instanceSampleUVs, 2);
      (newSampleUVAttr as THREE.BufferAttribute).usage = THREE.DynamicDrawUsage;
      newGeometry.setAttribute('instanceSampleUV', newSampleUVAttr);
      this.instancedMesh.geometry = newGeometry;
      oldGeo.dispose();
    } else {
      this.updateInstanceSampleUVs(w, h, size);
    }

    this.instanceCount = newCount;
    this.instancedMesh.count = newCount;
    this.updateInstanceMatrices(w, h, size);
  }

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

  setNoiseIntensity(intensity: number): void {
    this.noiseIntensity = Math.max(0.0, Math.min(1.0, intensity));
    if (this.material) {
      this.material.uniforms.uNoiseIntensity.value = this.noiseIntensity;
    }
  }

  setNoiseFPS(fps: number): void {
    this.noiseFPS = Math.max(1.0, fps);
    this.lastNoiseUpdateTime = performance.now();
  }

  setSetCount(setCount: number): void {
    this.setCount = Math.max(1, setCount);
    if (this.material) {
      this.material.uniforms.uRowCount.value = this.setCount;
      this.material.uniforms.uSetCount.value = this.setCount;
    }
  }

  setSetSelectionMode(mode: 'first' | 'random' | 'cycle'): void {
    this.setSelectionMode = mode;
    if (this.material) {
      this.material.uniforms.uSetSelectionMode.value =
        mode === 'first' ? 0 : mode === 'random' ? 1 : 2;
    }
  }

  getRenderTarget(): THREE.WebGLRenderTarget {
    return this.renderTarget;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  dispose(): void {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      if (this.instancedMesh.material instanceof THREE.Material) {
        this.instancedMesh.material.dispose();
      }
      this.scene.remove(this.instancedMesh);
      this.instancedMesh = null;
    }
    if (this.planeGeometry) {
      this.planeGeometry.dispose();
      this.planeGeometry = null;
    }
    this.renderTarget.dispose();
    if (this.atlasResult?.texture) {
      this.atlasResult.texture.dispose();
    }
    this.material = null;
  }
}
