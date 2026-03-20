

# PWA 오프라인 강의자료 + 로그인 페이지 설치 버튼

## 요약

PWA를 설정하여 앱 셸을 오프라인 캐싱하고, IndexedDB로 강의자료(PDF)를 미리 저장/오프라인 열람할 수 있게 합니다. 로그인 페이지에 "앱 설치" 버튼을 추가합니다.

## 구현 계획

### 1. PWA 기본 설정
- `vite-plugin-pwa` 설치
- `vite.config.ts`에 PWA 플러그인 설정 (manifest, 서비스 워커, 앱 셸 캐싱)
- `index.html`에 PWA 메타태그 추가
- 앱 아이콘 파일 생성 (`public/pwa-192x192.png`, `pwa-512x512.png` — 기존 로고 기반)

### 2. 로그인 페이지에 PWA 설치 버튼 추가
- `src/pages/Login.tsx`에 `beforeinstallprompt` 이벤트를 감지하여 "앱 설치" 버튼 표시
- Sign in / Sign up 버튼 아래에 배치
- 이미 설치됐거나 브라우저가 미지원이면 버튼 숨김

### 3. IndexedDB 오프라인 저장 유틸리티
- `src/lib/offlineStorage.ts` (신규) — `idb-keyval` 사용
  - `savePdfOffline(materialId, blob)` — PDF를 IndexedDB에 저장
  - `loadPdfOffline(materialId)` — 캐시된 PDF 로드
  - `removePdfOffline(materialId)` — 캐시 삭제
  - `isPdfCached(materialId)` — 캐시 여부 확인

### 4. 강의자료 오프라인 우선 로딩
- `StudentMaterialsSectionBlob.tsx` 수정:
  - PDF 로딩 시 IndexedDB 먼저 확인 → 없으면 네트워크 다운로드 → 다운로드 성공 시 자동 캐싱
  - 네트워크 실패 + 캐시 없음 → "오프라인에서 사용할 수 없습니다" 안내

### 5. MyLectures에 오프라인 저장 버튼
- `src/pages/MyLectures.tsx` — 각 강의 카드에 "오프라인 저장" 버튼 추가
  - 저장 완료 시 체크 표시, 삭제 가능

## 파일 변경 목록
| 파일 | 작업 |
|------|------|
| `vite.config.ts` | PWA 플러그인 추가 |
| `index.html` | PWA 메타태그 |
| `public/manifest.json` | 앱 매니페스트 |
| `src/lib/offlineStorage.ts` | 신규 — IndexedDB 유틸 |
| `src/pages/Login.tsx` | PWA 설치 버튼 추가 |
| `src/components/lecture/StudentMaterialsSectionBlob.tsx` | 오프라인 우선 로딩 |
| `src/pages/MyLectures.tsx` | 오프라인 저장 버튼/상태 표시 |

