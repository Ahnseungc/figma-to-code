---
name: figma-to-code
description: >-
  Implements a Figma frame or component in code with exact design-token mapping,
  for any design system (Tailwind, CSS variables, styled-components, a custom DS).
  Builds or reads a project token map first, compares Figma node values to tokens
  in three passes before writing code, and finishes with a screenshot-based visual QA.
  Use when the user pastes a Figma URL or node-id, or says "implement this design",
  "피그마 구현", "디자인 그대로", "시안대로", "토큰 매핑".
---

# Figma → 코드 (디자인 시스템 중립)

Figma MCP가 주는 참고 코드는 **범용 스니펫**이다. 그대로 쓰면 `text-[15px]`, `bg-[#F5F5F5]`,
`gap-8` 같은 임의 값이 남고 프로젝트 디자인 시스템(DS)을 우회한다. 이 스킬은 **노드 수치 → 프로젝트 토큰**
을 한 줄씩 대응시킨 뒤에만 코드를 쓰게 한다.

## 0. 프로젝트 토큰 맵 (최초 1회)

1. `.claude/figma-to-code.md` 가 있으면 읽는다. 이것이 이 프로젝트의 매핑 정본이다.
2. 없으면 코드베이스에서 찾아 **만든다** — 템플릿: `references/token-map-template.md`.
   - 타이포: Tailwind `@theme`/`@utility`, `tailwind.config.*` `fontSize`, CSS 변수, theme 객체
   - 색: 시맨틱 토큰(`--color-text-*`, `colors.text.*` 등). 원시 팔레트만 있으면 그 사실을 적는다
   - 간격 단위(4px? 8px?), 반경, 그림자 유틸
   - DS 컴포넌트 위치(Button, Modal 등), 아이콘 폴더와 아이콘 작성 방식
   - Figma 변수 이름 규칙 ↔ 코드 토큰 이름 규칙 (예: `spacing-200` = 20px)
3. 확신이 없는 칸은 비워 두고 사용자에게 묻는다. **추측으로 채우지 않는다.**

이후 모든 단계는 이 맵을 기준으로 한다.

## 1. 노드 읽기

MCP 연결·폴백은 `figma-mcp-setup` 스킬. URL `?node-id=12-345` → `nodeId` `12:345`.

| 순서 | 도구 | 얻는 것 |
|---|---|---|
| 1 | `get_design_context` | 레이아웃·텍스트·참고 코드·에셋 URL |
| 2 | `get_screenshot` | **시각 기준(베이스라인)** — 구현 후 QA에 그대로 쓴다 |
| 3 | `get_variable_defs` | 노드에 묶인 Figma Variables 이름·값 |
| 4 | `get_metadata` | 큰 프레임이면 자식 노드로 쪼개 다시 읽기 |

아이콘이 있는 화면이면 이 단계에서 **아이콘 인벤토리**(구간·개수·이름, `.svg` URL 유무)를 같이 만든다.

## 2. 3회 대조 — 끝나기 전엔 코드를 쓰지 않는다

| 회차 | 할 일 | 산출 |
|---|---|---|
| **1회** | 노드의 타이포·색·간격·반경·그림자를 토큰 맵과 **한 줄씩** 대응 (`references/token-mapping.md`) | 짧은 매핑 메모 |
| **2회** | DS 컴포넌트로 대체 가능한지 확인(`search_design_system`, 코드 grep). 아이콘 SVG 확보 경로 확정 | 쓸 컴포넌트·클래스 목록 |
| **3회** | 매핑 메모에서 임의 값(`[..px]`, Hex, 토큰에 없는 유틸)이 남았는지 스캔. 쓰려는 클래스·토큰을 **grep 해서 실제로 존재하는지** 확인 | 이때부터 구현 |

MCP 한도·오류로 노드를 못 읽으면 대조를 끝낼 수 없다. 사용자에게 알리고 스크린샷·Dev Mode 수치 중
무엇으로 대체할지 합의한다. 추측 구현 금지.

## 3. 구현 규칙

- 참고 코드는 **재작성**한다. 복붙하지 않는다.
- 쓰려는 토큰·유틸은 **grep으로 존재 확인** 후 사용. 없으면 가장 가까운 토큰 + 이유 메모, 차이가 크면 토큰 추가를 제안.
- DS 컴포넌트 내부는 요청 없이 고치지 않는다. 조합·래핑만.
- 아이콘은 SVG → 컴포넌트, 색은 `currentColor`. MCP의 `http://localhost:3845/assets/...` 는 세션 임시 URL이라
  코드에 남기지 않는다. 이미지는 프로젝트 에셋/CDN으로 옮긴다.
- Figma의 `HH:MM`, `yyyy.MM.dd`, `n원`, `Lorem` 같은 **자리표시 문구**를 사용자 노출 문자열로 고정하지 않는다.
  API 필드에 연결하거나 폴백 문구를 정한다.
- Figma 컴포넌트 variant 값(`content="2"`)과 리스트 행 순서가 다를 수 있다. export 파일 번호로 매핑하지 말고 variant를 정본으로.

## 4. MCP ≠ 정본인 경우

`get_design_context`는 편집기 트리다. 아래는 구현이 달라도 버그가 아니다. QA 보고에 **의도된 차이** 한 줄만 남긴다.

- 한 캔버스의 absolute 배치 ↔ 웹의 레이아웃·스크롤 컨테이너 (예: 루트 전체 그라데이션 → 상단 영역만)
- 합성된 히어로/배너 프레임 ↔ CMS 이미지 캐러셀
- 래퍼에 붙은 `rotate-*` ↔ 내부에 이미 transform이 있는 공유 SVG 아이콘

판단 순서: 스펙 문서 → 기존 코드·리뷰 합의 → 그다음 MCP 수치.

## 5. 끝내는 조건

1. 타입체크·린트 통과
2. **`figma-visual-qa` 스킬로 베이스라인 스크린샷과 시각 대조 완료**
3. 최종 보고에 `비교한 nodeId` · `맞춘 항목` · `남은 차이(의도/미해결)` 포함

시각 QA 전에는 완료라고 말하지 않는다.

## 참고

- 토큰 매핑 상세와 흔한 오매핑: `references/token-mapping.md`
- 토큰 근거를 짧게 남기면 리뷰가 쉽다: "Figma 16/24/700 → `--text-b2-*` 와 일치 → `text-b2-bold`"
