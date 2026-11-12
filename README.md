# figma-to-code

Figma 시안을 코드로 옮기는 Claude Code 플러그인입니다. 에이전트 3개, 스킬 7개, 스크립트 3개로 되어 있습니다.

Figma MCP의 `get_design_context`를 그대로 쓰면 `text-[15px]`, `bg-[#F5F5F5]` 같은 임의 값이 남고, 프로젝트 디자인 시스템을 우회하게 됩니다. 이 플러그인은 Figma 노드의 수치를 프로젝트 토큰에 하나씩 맞춘 뒤에 코드를 쓰게 하고, 구현이 끝나면 수치와 스크린샷으로 두 번 검증합니다. 실서비스에서 시안 QA를 반복하며 나온 실수들을 규칙으로 정리했습니다.

특정 디자인 시스템에 묶여 있지 않습니다. 처음 실행할 때 코드베이스에서 토큰을 찾아 매핑 파일을 만들고, 이후에는 그 파일을 기준으로 작업합니다.

## 동작 방식

```
Figma URL
   │
   ▼
design-orchestrator    요청 분류, 서브에이전트에 위임
   │
   ▼
design-ui              노드 읽기 → 3회 대조 → 구현 → 스펙 QA → 시각 QA
   │
   ▼
design-qa              체크리스트, 테스트 갭, 회귀
   │
   ▼
통합 보고
```

`design-ui` 안에서는 이 순서로 진행합니다.

```
토큰 맵 확인 (.claude/figma-to-code.md, 없으면 생성)
   │
노드 읽기     get_design_context · get_screenshot · get_variable_defs · REST 스냅샷
   │
1회 대조      노드 수치 ↔ 토큰
2회 대조      디자인 시스템 컴포넌트 재사용, 아이콘 SVG 확보
3회 대조      임의 값이 남았는지, 쓰려는 토큰이 실제로 있는지 grep
   │
구현
   │
스펙 QA       REST 스냅샷 ↔ MCP ↔ 코드. 어긋나면 구현으로 돌아감
시각 QA       구현 전에 찍은 스크린샷 ↔ 실제 화면. 어긋나면 구현으로 돌아감
```

수치는 REST 스냅샷, 변수 이름은 `get_variable_defs`, 시각은 `get_screenshot`을 기준으로 봅니다. MCP가 주는 참고 코드는 구조를 파악하는 데만 씁니다.

레이아웃이나 CMS 때문에 일부러 Figma와 다르게 만든 부분은 고치지 않고 의도된 차이로 기록만 합니다.

## 구성

```
figma-to-code/
├── .claude-plugin/             plugin.json, marketplace.json
├── agents/
│   ├── design-orchestrator.md  요청 분류, 핸드오프, 통합 보고
│   ├── design-ui.md            구현과 디자인 QA
│   └── design-qa.md            체크리스트, 테스트 갭, API 계약
├── skills/
│   ├── figma-mcp-setup/        로컬 Dev Mode MCP 연결, HTTP 직접 호출
│   ├── figma-to-code/          토큰 맵, 3회 대조, 구현 규칙
│   ├── design-reuse-first/     기존 컴포넌트 먼저 찾기
│   ├── figma-storybook-scaffold/  스토리 먼저 만들고 구현
│   ├── figma-spec-qa/          REST·MCP·코드 수치 교차 대조
│   ├── figma-visual-qa/        스크린샷 기준 시각 QA
│   └── figma-page-qa/          긴 페이지의 배경색, 아이콘 누락
├── scripts/
│   ├── fetch-node-spec.mjs     REST 노드 → 스펙 JSON
│   ├── export-assets.mjs       매니페스트로 여러 노드 일괄 export
│   ├── export-node-png.mjs     노드 하나 PNG
│   └── lib/
└── examples/
    └── assets.manifest.json
```

## 설치

Claude Code에서 다음을 실행합니다.

```
/plugin marketplace add Ahnseungc/figma-to-code
/plugin install figma-to-code@figma-to-code
```

Cursor 등 다른 도구에서는 `skills/`를 `.cursor/skills/`에, `agents/`를 `.cursor/agents/`에 복사합니다.

Figma MCP는 Figma 데스크톱 앱의 Dev Mode에서 MCP 서버를 켠 뒤 등록합니다.

```bash
claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

## 초기 설정

첫 실행 때 에이전트가 타이포, 색, 간격, 반경, 그림자 토큰과 디자인 시스템 컴포넌트 위치를 찾아 `.claude/figma-to-code.md`를 만듭니다. 확신이 없는 항목은 비워 두고 묻습니다. 직접 작성하려면 [템플릿](skills/figma-to-code/references/token-map-template.md)을 복사해서 채웁니다.

Tailwind, CSS 변수, styled-components theme, 사내 디자인 시스템 패키지 모두 같은 방식으로 씁니다.

## 사용

```
design-orchestrator로 https://www.figma.com/design/…?node-id=12-345 화면 구현하고 QA까지
```

에이전트 없이 Figma URL을 주고 "이 화면 구현해줘"라고 해도 `figma-to-code` 스킬이 실행됩니다.

오케스트레이터 모드는 다음과 같습니다.

| 모드 | 언제 | 흐름 |
|---|---|---|
| 풀 | 새 화면, 기능 추가 (기본) | design-ui → design-qa |
| UI만 | QA 제외를 말했을 때 | design-ui |
| QA만 | 이미 구현된 화면, 버그 검증 | design-qa |
| 병렬 | UI와 API 검증이 독립적일 때 | design-ui, design-qa 동시 |

## 스킬

| 스킬 | 역할 |
|---|---|
| figma-mcp-setup | 로컬 MCP 우선 연결. 클라이언트에 등록이 안 돼 있으면 HTTP로 직접 호출 |
| figma-to-code | 토큰 맵 생성, 노드 읽기, 3회 대조, 구현 규칙 |
| design-reuse-first | 디자인 시스템과 공통 컴포넌트를 먼저 찾고 없을 때만 새로 만듦 |
| figma-storybook-scaffold | Figma URL을 parameters에 넣은 스토리를 먼저 만들고 구현 |
| figma-spec-qa | REST 스냅샷, MCP, 코드 토큰을 대조해 pass / fixed / intentional / open 로그 작성 |
| figma-visual-qa | 칩 줄바꿈, 내용 폭 뱃지, 일러스트, 메탈릭 색, 캐러셀 마지막 장 확인 |
| figma-page-qa | 구간별 배경색과 아이콘 개수 대조 |

타이포 오매핑 원인 9가지는 [token-mapping.md](skills/figma-to-code/references/token-mapping.md)에, 토큰 검사는 통과했는데 화면이 틀렸던 사례는 [case-missed-qa.md](skills/figma-visual-qa/references/case-missed-qa.md)에 있습니다.

## 스크립트

Node 18 이상이 필요합니다. `FIGMA_TOKEN`을 환경 변수나 `.env.local`에 넣어 둡니다. 토큰은 Figma 설정의 Personal access tokens에서 발급합니다.

스크립트는 플러그인 폴더에 있고 출력 경로와 `.env.local`은 실행한 디렉터리 기준이라, 프로젝트 루트에서 플러그인 경로로 실행합니다. 스킬 안에서는 `${CLAUDE_PLUGIN_ROOT}/scripts/...`로 부릅니다. 아래 예시는 이 레포를 클론한 디렉터리 기준입니다.

```bash
# 노드 스펙 스냅샷 (figma-spec-qa 입력)
node scripts/fetch-node-spec.mjs <fileKey> 12:345 specs/figma/12-345.json

# 매니페스트에 적은 노드들을 PNG/SVG로
node scripts/export-assets.mjs examples/assets.manifest.json

# 노드 하나를 4배 PNG로 (시각 QA 기준 이미지)
node scripts/export-node-png.mjs <fileKey> 12:345 baseline.png 4
```

`export-node-png.mjs`는 `--plugin` 옵션을 주면 토큰 없이 TalkToFigma 플러그인을 거쳐 export합니다.

## 라이선스

MIT
