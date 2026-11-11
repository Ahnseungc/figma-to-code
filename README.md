# figma-to-code

Figma 시안을 **어느 디자인 시스템에서든** 토큰 단위로 정확히 옮기고, 스크린샷 기준 시각 QA까지 끝내게 하는 Claude Code 플러그인입니다.

Figma MCP의 `get_design_context` 를 그대로 쓰면 `text-[15px]`, `bg-[#F5F5F5]`, 관성적인 `gap-8` 같은 값이 남습니다.
실서비스에서 시안 대비 QA를 수십 번 돌리며 반복해서 나온 실수들을 규칙으로 묶었습니다.

## 들어 있는 것

| 스킬 | 하는 일 |
|---|---|
| `figma-to-code` | 프로젝트 토큰 맵을 먼저 만들고, 노드 값을 3회 대조한 뒤에만 구현 |
| `figma-visual-qa` | 구현 전 `get_screenshot` 베이스라인과 실제 렌더를 나란히 비교. 토큰 검사가 놓치는 것을 잡는다 |
| `figma-mcp-setup` | 로컬 Dev Mode MCP 우선 연결, 등록 안 됐을 때 HTTP 직접 호출 |

`scripts/export-node-png.mjs` — 노드를 고해상도 PNG로 저장 (REST API 또는 TalkToFigma 플러그인 relay).

## 설치

### Claude Code

```
/plugin marketplace add Ahnseungc/figma-to-code
/plugin install figma-to-code@figma-to-code
```

### Cursor · 그 외

`skills/` 아래 폴더를 프로젝트의 `.cursor/skills/` (또는 `.claude/skills/`)로 복사합니다.

### Figma MCP

Figma 데스크톱 앱 → Dev Mode → MCP 서버 켜기 후:

```bash
claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

## 디자인 시스템에 맞추기

처음 실행하면 에이전트가 코드베이스에서 타이포·색·간격·반경·그림자 토큰과 DS 컴포넌트 위치를 찾아
`.claude/figma-to-code.md` 를 만듭니다. 이후 모든 매핑은 이 파일을 기준으로 합니다.
직접 채우려면 [템플릿](skills/figma-to-code/references/token-map-template.md)을 복사하세요.

Tailwind v3/v4, CSS 변수, styled-components theme, 자체 DS 패키지 모두 같은 방식으로 동작합니다.

## 핵심 원칙

1. **토큰 맵이 정본** — MCP 참고 코드는 구조 힌트일 뿐
2. **3회 대조 전엔 코드 없음** — 수치 매핑 → DS 재사용 확인 → 임의 값 스캔(grep으로 토큰 존재 확인)
3. **타이포는 네 값 세트로** — size만 맞추면 행간·자간이 틀린다. `<h1>` 태그나 레이어 이름으로 토큰을 고르지 않는다
4. **간격은 px로** — `spacing-200` 은 20px. 이름의 숫자를 믿지 않는다
5. **시각 QA까지가 구현** — 칩은 크롭해서, 일러스트는 같은 크롭을 나란히, 메탈릭 색은 평균 RGB로
6. **MCP ≠ 항상 정본** — 레이아웃·CMS 때문에 의도적으로 다른 부분은 기록만 하고 억지로 맞추지 않는다

실패 사례: [토큰 QA는 통과했는데 화면은 틀렸다](skills/figma-visual-qa/references/case-missed-qa.md)

## 기여

다른 디자인 시스템에서 쓰다가 생긴 오매핑 사례를 PR로 보내 주세요. `references/token-mapping.md` 표에 추가합니다.

## License

MIT

---

**English** — A Claude Code plugin for turning Figma designs into code with exact design-token mapping for any design system,
plus screenshot-based visual QA. It builds a project token map first, compares node values in three passes before writing code,
and checks what token linting misses (wrapped chip labels, hug-width badges, illustration and blend-mode color drift).
Install with `/plugin marketplace add Ahnseungc/figma-to-code`. Docs are in Korean.
