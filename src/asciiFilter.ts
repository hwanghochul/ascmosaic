import * as THREE from 'three';

/**
 * ASCII 필터 옵션
 */
export interface AsciiFilterOptions {
  /** 샘플링 비율 (픽셀 다운샘플링, 기본값: 4) */
  sampleRatio?: number;
  /** ASCII 문자 세트 (밝기 순서) */
  charset?: string;
  /** 출력 컨테이너 요소 */
  container: HTMLElement;
}

/**
 * ASCII 필터 클래스
 * WebGL 렌더러의 캔버스를 ASCII 아트로 변환합니다.
 */
export class AsciiFilter {
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private sampleRatio: number;
  private charset: string;
  private outputElement: HTMLPreElement;
  private isEnabled: boolean = false;
  private animationId: number | null = null;

  // 기본 ASCII 문자 세트 (밝기 순서: 어두움 -> 밝음)
  private static readonly DEFAULT_CHARSET = ' .,:;+=xX$&@#';

  constructor(renderer: THREE.WebGLRenderer, options: AsciiFilterOptions) {
    this.renderer = renderer;
    this.container = options.container;
    this.sampleRatio = options.sampleRatio ?? 4;
    this.charset = options.charset ?? AsciiFilter.DEFAULT_CHARSET;

    // ASCII 출력용 요소 생성
    this.outputElement = document.createElement('pre');
    this.outputElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      margin: 0;
      padding: 0;
      font-family: 'Courier New', monospace;
      font-size: 8px;
      line-height: 1;
      white-space: pre;
      overflow: hidden;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: #0f0;
      z-index: 10;
      pointer-events: none;
    `;
  }

  /**
   * RGB 값을 그레이스케일 밝기로 변환
   */
  private rgbToBrightness(r: number, g: number, b: number): number {
    // 가중 평균 방식 (인간의 시각에 맞춘 가중치)
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  }

  /**
   * 밝기 값을 ASCII 문자로 변환
   */
  private brightnessToChar(brightness: number): string {
    const index = Math.floor(brightness * (this.charset.length - 1));
    return this.charset[Math.min(index, this.charset.length - 1)];
  }

  /**
   * 캔버스 픽셀 데이터를 ASCII 문자열로 변환
   */
  private convertToAscii(): string {
    const canvas = this.renderer.domElement;
    const width = canvas.width;
    const height = canvas.height;

    // 2D 컨텍스트로 픽셀 데이터 읽기
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // WebGL 컨텍스트인 경우, ImageData를 직접 읽을 수 없으므로
      // 임시 2D 캔버스를 사용하여 복사
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        return this.processImageData(imageData, width, height);
      }
      return '';
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    return this.processImageData(imageData, width, height);
  }

  /**
   * ImageData를 처리하여 ASCII 문자열 생성
   */
  private processImageData(imageData: ImageData, width: number, height: number): string {
    const data = imageData.data;
    const outputWidth = Math.floor(width / this.sampleRatio);
    const outputHeight = Math.floor(height / this.sampleRatio);
    const lines: string[] = [];

    for (let y = 0; y < outputHeight; y++) {
      let line = '';
      for (let x = 0; x < outputWidth; x++) {
        // 원본 픽셀 좌표 계산
        const srcX = x * this.sampleRatio;
        const srcY = y * this.sampleRatio;

        // 샘플링 영역의 평균 밝기 계산
        let totalBrightness = 0;
        let sampleCount = 0;

        for (let dy = 0; dy < this.sampleRatio && srcY + dy < height; dy++) {
          for (let dx = 0; dx < this.sampleRatio && srcX + dx < width; dx++) {
            const idx = ((srcY + dy) * width + (srcX + dx)) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            totalBrightness += this.rgbToBrightness(r, g, b);
            sampleCount++;
          }
        }

        const avgBrightness = totalBrightness / sampleCount;
        line += this.brightnessToChar(avgBrightness);
      }
      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * ASCII 출력 업데이트
   */
  private update(): void {
    if (!this.isEnabled) return;

    try {
      // 캔버스에서 픽셀 데이터 읽기
      const asciiText = this.convertToAscii();
      this.outputElement.textContent = asciiText;
    } catch (error) {
      console.error('ASCII 변환 오류:', error);
    }
  }

  /**
   * 필터 활성화
   */
  enable(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    this.container.appendChild(this.outputElement);
    
    // 애니메이션 루프 시작
    const animate = () => {
      if (!this.isEnabled) return;
      this.update();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * 필터 비활성화
   */
  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.outputElement.parentNode) {
      this.outputElement.parentNode.removeChild(this.outputElement);
    }
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
    this.disable();
  }
}
