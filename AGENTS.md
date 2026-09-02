# AGENTS.md

## 1. Project Overview

이 프로젝트는 짧은 영상을 대여하여 시청할 수 있는 웹 플랫폼입니다.

서비스 컨셉:

- 이름: VIDEO ROOM
- 오래된 비디오 대여점의 감성을 현대적으로 재해석한 서비스
- 캐릭터가(고양이) VIDEO ROOM의 직원 역할을 함
- 전체 UI는 다크 네이비 기반의 깔끔하고 세련된 비디오샵 분위기
- 과도한 레트로/픽셀 스타일은 사용하지 않음

주요 페이지:

- 메인 페이지 / Video Room
- 영상 상세 페이지
- 영상 플레이 페이지
- 마이페이지 / My Bag
- 관리자 영상 관리 페이지
- 관리자 영상 등록/수정 페이지

## 2. Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
  가능하면 Server Component를 기본으로 사용하고,
  상태 또는 브라우저 API가 필요한 경우에만 Client Component를 사용합니다.
  `'use client'`를 불필요하게 추가하지 않습니다.

## 3. Project Scope

### 수정 가능

기능 구현 시 아래 디렉터리를 수정할 수 있습니다.

- `app/`
- `components/`
- `features/`
- `hooks/`
- `lib/`
- `types/`
- `data/`
- `public/`
  기존 구조가 존재한다면 새로운 폴더를 만들기 전에 현재 구조를 먼저 확인하고 기존 패턴을 따릅니다.

### 임의 수정 금지

명확한 요청이 없다면 아래 항목을 변경하지 않습니다.

- `.env`
- `.env.local`
- `package.json`
- lock 파일
- eslint 설정
- prettier 설정
- tsconfig
- build 설정
- 배포 설정
- 인증 관련 설정
  새로운 라이브러리를 임의로 설치하지 않습니다.
  라이브러리 추가가 반드시 필요한 경우 먼저 기존 패키지로 해결 가능한지 확인합니다.

## 4. File Convention

### 파일명

React Component: PascalCase
Hook: camelCase + `use` prefix
Utility: camelCase
Type: 관련 도메인별 파일로 관리합니다.

## 5. Naming Convention

변수와 함수 이름은 의미를 알 수 있도록 작성합니다.
boolean 값은 의미가 드러나는 prefix를 사용합니다.
이벤트 함수는 `handle` prefix를 사용합니다.

## 6. Component Rules

컴포넌트는 하나의 역할에 집중합니다.
페이지 하나에 모든 UI를 작성하지 않습니다.
반복되는 UI는 반드시 Component로 분리합니다.
하지만 한 번만 사용되는 매우 작은 UI까지 무조건 컴포넌트로 분리하지 않습니다.

## 7. VIDEO ROOM Design Rules

전체 디자인은 현재 VIDEO ROOM 디자인 시스템을 유지합니다.

### Main Colors

기본:

- Background: dark navy / almost black
- Surface: slightly lighter navy
- Primary: violet
- Accent: warm orange
- Text: off-white
- Secondary text: blue gray

Tailwind arbitrary color를 화면마다 임의로 추가하지 않습니다.
가능하면 프로젝트의 공통 색상 token을 사용합니다.

### Visual Direction

목표:

> 깔끔하고 세련된 현대적인 비디오 대여점

사용:

- Dark navy
- Soft border
- Subtle shadow
- VHS / Video motifs
- Neon sign accents
- Rounded UI
- Large movie artwork
- Staff cat character

사용 금지:

- 지나친 cyberpunk
- 과도한 neon glow
- 과도한 glassmorphism
- beige 기반 빈티지 UI
- pixel-art 중심 UI
- Netflix UI 그대로 모방
- 필요 이상의 gradient

## 8. Staff Cat Rules

고양이는 VIDEO ROOM의 직원 캐릭터입니다.
고양이를 단순 장식 이미지로만 사용하지 않고 서비스의 안내 역할을 할 수 있도록 사용합니다.

예:

메인 페이지

```txt
어서 와요.
오늘은 어떤 이야기를 빌려가실래요?
```

영상 상세

```txt
이 작품은 조용한 밤에 보는 걸 추천해요.
```

관리자

```txt
새로운 비디오가 들어왔어요.
```

단, 모든 영역에 고양이를 넣지 않습니다.
페이지당 1~2개 정도만 사용하여 콘텐츠보다 캐릭터가 더 강조되지 않도록 합니다.

---

## 9. Video Domain Terminology

서비스 컨셉에 맞춰 아래 용어를 우선 사용합니다.

| 일반적인 표현 | VIDEO ROOM 표현 |
| ------------- | --------------- |
| Watch         | 보기            |
| Purchase      | 구매            |
| Library       | My Bag          |
| Admin         | Staff Only      |
| Upload Video  | 새 비디오 등록  |

그러나 UX가 불명확해지는 경우 세계관보다 사용성을 우선합니다.

## 10. TypeScript Rules

`any` 사용을 피합니다.

가능하면 명확한 type/interface를 정의합니다.
가능하면 props 타입도 명확하게 정의합니다.
불필요한 type assertion을 사용하지 않습니다.
같은 코드는 특별한 이유가 없다면 사용하지 않습니다.

## 11. React Rules

state를 불필요하게 생성하지 않습니다.
derived state는 변수로 계산합니다.
`useEffect`는 외부 시스템 동기화가 필요한 경우에 사용합니다.
단순 계산을 위해 `useEffect`를 사용하지 않습니다.

## 12. Styling Rules

Tailwind CSS를 기본으로 사용합니다.
`className`이 지나치게 길어지는 경우 컴포넌트 구조를 먼저 검토합니다.
inline style 사용은 최소화합니다.
반응형을 고려합니다.

기본 우선순위:

1. Desktop
2. Tablet
3. Mobile

모든 주요 페이지는 최소한 다음 환경에서 깨지지 않아야 합니다.

- 1440px
- 1024px
- 768px
- 375px

## 13. Accessibility

이미지에는 적절한 `alt`를 제공합니다.
버튼 기능은 `div` 대신 `button`을 사용합니다.
아이콘만 있는 버튼은 `aria-label`을 제공합니다.
keyboard interaction이 필요한 UI는 키보드로도 사용할 수 있어야 합니다.

## 14. Error / Loading / Empty State

API 데이터를 사용하는 페이지는 아래 상태를 고려합니다.

- Loading
- Error
- Empty
- Success

예:
영상이 없는 경우

````txt
아직 진열된 비디오가 없어요.
``
대여 영상이 없는 경우
```txt
아직 빌린 비디오가 없어요.

## 15. Admin Page Rules

관리자 페이지는 사용자 페이지보다 정보 밀도와 관리 효율성을 우선합니다.

사용:
- Table
- Filter
- Search
- Pagination
- Status Badge

관리 화면에 지나친 장식 요소를 추가하지 않습니다.
Staff Cat은 작은 안내 캐릭터 수준으로만 사용합니다.

## 16. Code Modification Rules

작업 전:
1. 관련 파일 구조 확인
2. 기존 Component 검색
3. 기존 type 확인
4. 기존 utility 확인
5. 기존 디자인 패턴 확인

이미 존재하는 기능을 다시 만들지 않습니다.

기존 코드 수정 시:
- 요청과 관련 없는 코드는 수정하지 않음
- 대규모 refactoring 금지
- 기존 동작을 깨뜨리지 않음
- 기존 naming convention 유지

## 17. Do Not

다음 행동을 하지 않습니다.
- 사용자 요청 없이 dependency 설치
- 전체 프로젝트 구조 변경
- unrelated refactoring
- 임의의 API specification 변경
- 기존 type 삭제
- 임의의 mock data 삭제
- `console.log` 남기기
- `any` 남발
- duplicate component 생성
- 의미 없는 wrapper `div` 추가
- 요청하지 않은 디자인 변경

## 18. Definition of Done

작업 완료 전에 반드시 확인합니다.

### Code

- TypeScript error 없음
- ESLint error 없음
- 사용하지 않는 import 없음
- `console.log` 없음
- 불필요한 코드 없음

### UI

- 기존 VIDEO ROOM 디자인 유지
- Desktop layout 깨지지 않음
- Mobile에서 주요 기능 사용 가능
- hover / active / disabled 상태 확인

### Function

- 요청한 기능 정상 작동
- loading 상태 확인
- empty 상태 확인
- error 상태 확인
- 기존 기능 regression 없음

## 19. Before Finishing

작업 완료 시 변경 사항을 간단히 정리합니다.
다음 형식으로 보고합니다.

### 변경 사항

### 수정한 파일

### 확인 사항
- TypeScript
- ESLint
- Responsive UI

요청 범위를 넘어선 추가 작업이 필요하면 임의로 구현하지 말고 별도로 알려주세요.

## 20. Core Identity

VIDEO ROOM 작업에서 아래 네 가지는 프로젝트의 핵심 디자인 규칙으로 유지합니다.

- **VIDEO ROOM = 현대적으로 재해석한 비디오 대여점**
- **Staff = 파란 눈의 고양이 직원**
- **Main UI = Dark Navy + Violet + Warm Orange**
- **Cute, but not childish / Retro, but not outdated**

새로운 페이지나 기능을 추가할 때도 위 방향성을 유지합니다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
````
