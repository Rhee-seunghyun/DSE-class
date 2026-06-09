## 문제 원인

`/my-class` 진입 시 `profiles` 조회가 500 에러로 실패합니다.

응답:
```
{"code":"42P17","message":"infinite recursion detected in policy for relation \"whitelist\""}
```

`profiles` 가 실패하면 `useAuth`의 `profile`이 null 이 되어, `MyClass`의 `enabled: !!profile?.user_id` 조건 때문에 강의 목록 쿼리가 아예 실행되지 않습니다. 그래서 클래스가 전부 사라진 것처럼 보입니다.

### 순환 구조

어제 적용한 보안 마이그레이션 이후 RLS 정책 체인이 아래처럼 꼬였습니다.

```text
profiles  (Speakers can view enrolled students)
   └─ subquery → whitelist
        └─ (Staff can view whitelist for assigned lectures)
             └─ subquery → staff_lecture_assignments
                  └─ (Speakers can view assignments for their lectures)
                       └─ subquery → lectures
                            └─ (Students can view lectures they have access to)
                                 └─ subquery → whitelist  ← 재귀!
```

## 해결 방법

RLS 정책 안에서 다른 테이블을 조인하는 대신, `SECURITY DEFINER` 함수로 권한 체크를 캡슐화하여 순환을 끊습니다 (프로젝트 메모리의 "RLS Recursion Fix" 패턴과 동일).

### 새 SECURITY DEFINER 함수 추가

1. `public.student_has_lecture_access(_lecture_id uuid, _email text)` — 화이트리스트에 등록된 수강생인지 확인
2. `public.speaker_owns_lecture(_user_id uuid, _lecture_id uuid)` — 해당 강의의 연자인지 확인
3. `public.staff_assigned_to_lecture(_user_id uuid, _lecture_id uuid)` — 해당 강의에 배정된 staff인지 확인

모두 `SET search_path = public` 적용. `authenticated`에 EXECUTE 권한 부여.

### RLS 정책 재작성

순환을 일으키는 정책을 함수 기반으로 교체합니다.

- `lectures`: "Students can view lectures they have access to"
  → `student_has_lecture_access(lectures.id, auth.jwt() ->> 'email')`
- `staff_lecture_assignments`: "Speakers can view assignments for their lectures"
  → `speaker_owns_lecture(auth.uid(), lecture_id)`
- `whitelist`: "Staff can view/update/delete whitelist for assigned lectures" 3개
  → `staff_assigned_to_lecture(auth.uid(), lecture_id)`
- `profiles`: "Speakers can view enrolled students"
  → 함수로 묶거나, JWT 이메일 + 함수 기반 체크로 변경

### 검증

마이그레이션 후:
- master 계정 (`omsrheesh@gmail.com`) 으로 `/my-class` 진입 → 클래스 2개 표시 확인
- 수강생 계정으로 `/my-lectures` 진입 → 본인 강의 표시 확인
- 네트워크 응답에 42P17 에러가 사라졌는지 확인
