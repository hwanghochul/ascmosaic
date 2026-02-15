# AscMosaic

Three.js 기반 TypeScript 라이브러리로, 3D 모델에 ASCII 모자이크 필터를 적용할 수 있는 웹 라이브러리입니다.

## 목차

- [설치](#설치)
- [빌드](#빌드)
- [에디터 사용](#에디터-사용)
- [프로젝트 구조](#프로젝트-구조)
- [문서](#문서)
- [라이선스](#라이선스)

## 설치

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치 단계

1. **저장소 클론 또는 다운로드**

```bash
git clone <repository-url>
cd ascmosaic
```

또는 프로젝트 폴더를 직접 다운로드합니다.

2. **의존성 설치**

```bash
npm install
```

이 명령어는 다음 패키지들을 설치합니다:
- `three` - 3D 그래픽 라이브러리
- `typescript` - TypeScript 컴파일러
- `vite` - 빌드 도구
- 기타 개발 의존성

3. **설치 확인**

설치가 완료되면 `node_modules` 폴더가 생성되고, `package-lock.json` 파일이 업데이트됩니다.

## 빌드

### 라이브러리 빌드

라이브러리를 빌드하여 `dist` 폴더에 생성합니다:

```bash
npm run build
```

빌드 후 다음 파일들이 생성됩니다:
- `dist/ascmosaic.js` - ES 모듈 버전
- `dist/ascmosaic.umd.cjs` - UMD 버전
- `dist/index.d.ts` - TypeScript 타입 정의
- `dist/index.html` - 에디터 HTML
- `dist/ascmosaic-app.js` - 스니펫 앱 진입점

### 개발 모드

에디터를 개발 모드로 실행합니다:

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하여 에디터를 사용할 수 있습니다.

## GitHub Pages 배포

이 프로젝트는 GitHub Pages로 자동 배포됩니다.

### 자동 배포 설정

1. **GitHub 저장소 설정**
   - 저장소의 Settings → Pages로 이동
   - Source를 "GitHub Actions"로 선택

2. **자동 배포**
   - `main` 브랜치에 푸시하면 자동으로 빌드 및 배포됩니다
   - GitHub Actions 워크플로우가 자동으로 실행됩니다

3. **배포 확인**
   - Actions 탭에서 배포 상태 확인
   - 배포 완료 후 `https://<username>.github.io/<repository-name>`에서 접속 가능

### 수동 배포

필요한 경우 수동으로 배포할 수도 있습니다:

```bash
# 빌드 실행
npm run build

# dist 폴더의 내용을 gh-pages 브랜치에 푸시
# (또는 GitHub Actions를 사용하는 것이 권장됩니다)
```

**참고**: `.gitignore`에서 `dist/` 폴더는 제외되어 있지만, GitHub Actions가 자동으로 빌드하여 배포합니다.

## 에디터 사용

AscMosaic 에디터를 사용하면 코드 작성 없이 시각적으로 3D 모델과 모자이크 필터를 설정할 수 있습니다.

**자세한 사용 방법은 [에디터 사용 가이드](./docs/EDITOR_GUIDE.md)를 참고하세요.**

에디터에서 제공하는 주요 기능:
- 다양한 도형 선택 (구, 큐브, 평면, GLB 모델)
- 텍스처 및 비디오 적용
- ASCII 모자이크 필터 설정
- 카메라 컨트롤 (오비트, 틸트, 고정)
- 실시간 HTML 코드 생성

## 프로젝트 구조

```
ascmosaic/
├── src/                    # 라이브러리 소스 코드
│   ├── index.ts           # 메인 진입점
│   ├── asciiMosaicFilter.ts  # ASCII 모자이크 필터
│   ├── texturedMesh.ts    # 텍스처 메시 생성
│   └── orbitControls.ts   # 오비트 컨트롤
├── editor/                 # 에디터 애플리케이션
│   ├── index.html         # 에디터 HTML
│   ├── main.ts            # 에디터 메인 로직
│   └── ascmosaic-app.ts   # 스니펫 앱 진입점
├── public/                 # 공개 리소스
│   └── resource/          # 텍스처, 모델 등 리소스
│       └── resource_list.json  # 리소스 목록
├── dist/                   # 빌드 출력 (자동 생성)
├── docs/                    # 문서
│   └── EDITOR_GUIDE.md    # 에디터 사용 가이드
├── package.json
└── README.md
```

## 문서

- **[에디터 사용 가이드](./docs/EDITOR_GUIDE.md)** - 에디터 사용 방법, 리소스 추가 방법, HTML 적용 방법 등 상세 가이드

## 사용 방법 (프로그래밍 방식)

라이브러리를 직접 코드에서 사용하는 경우:

```typescript
import { AscMosaic, createCube, createSphere } from 'ascmosaic';

// 컨테이너 요소 가져오기
const container = document.getElementById('canvas-container')!;

// AscMosaic 인스턴스 생성
const mosaic = new AscMosaic(container);

// 모델 추가
await mosaic.addModel({
  shape: 'sphere',
  radius: 2,
  textureUrl: '/resource/earth.jpg'
});

// 오비트 컨트롤 설정
mosaic.setupOrbitControls();

// 애니메이션 시작
mosaic.animate();
```

## 라이선스

ISC
