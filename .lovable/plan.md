## 목표
My Class 페이지 상단의 클래스 목록을 버튼 나열 대신 **드롭다운(Select)**으로 교체하여 클래스가 쌓여도 공간을 효율적으로 사용합니다.

## 변경 내용

### 1. MyClass.tsx - 클래스 선택 UI 교체
- 기존에 추가한 `flex flex-wrap gap-2` 버튼 그룹을 제거
- `shadcn/ui Select` 컴포넌트를 사용한 드롭다운으로 교체
- 드롭다운 위치: 페이지 헤더 하단 또는 카드 상단
- 드롭다운에 표시할 텍스트: `{날짜} · {강의 제목}` (기존과 동일한 형식)
- 기본 선택값: `selectedLectureId` (첫 번째 강의 자동 선택 유지)

### 기술 세부사항
- 파일: `src/pages/MyClass.tsx`
- 컴포넌트: `src/components/ui/select.tsx` (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`) 재사용
- 상태: 기존 `selectedLectureId` + `setSelectedLectureId` 그대로 사용 — 추가 상태 불필요
- 반응형: 드롭다운 너비는 화면 크기에 맞춰 유동적으로 조정 (`w-full` 또는 `lg:w-80` 등)

### 예상 결과
- 클래스 수가 늘어나도 상단 UI가 1줄로 유지됨
- 선택 항목은 `{날짜} · {제목}` 형식으로 표시됨
- 기존 자동 선택, 학생 테이블 불러오기 등 모든 동작 그대로 유지