# AscMosaic

Three.js 기반 TypeScript 라이브러리

## 설치

```bash
npm install
```

## 개발

### 라이브러리 빌드

```bash
npm run build
```

### Editor 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 사용 방법

```typescript
import { AscMosaic, createCube, createSphere } from 'ascmosaic';

// 컨테이너 요소 가져오기
const container = document.getElementById('canvas-container')!;

// AscMosaic 인스턴스 생성
const mosaic = new AscMosaic(container);

// 큐브 추가
mosaic.addCube();

// 애니메이션 시작
mosaic.animate();

// 또는 유틸리티 함수 사용
const cube = createCube(1, 0x00ff00);
const sphere = createSphere(0.5, 0xff0000);
```

## 프로젝트 구조

```
ascmosaic/
├── src/              # 라이브러리 소스 코드
│   └── index.ts      # 메인 진입점
├── editor/           # Editor 애플리케이션
│   ├── index.html
│   └── main.ts
├── dist/             # 빌드 출력 (자동 생성)
└── package.json
```

## 라이선스

ISC
