---
name: figma-spec-qa
description: >-
  After implementing UI from a Figma node, cross-checks three sources: the Figma REST
  nodes snapshot (source of truth), what the Figma MCP returned, and the tokens actually
  used in code. Logs pass / fixed / intentional / open per item and loops until nothing
  is open. Run before visual QA. Use for "값 대조", "스펙 QA", "REST 대조", "수치 검증",
  "spec diff", or as the post-implementation step of figma-to-code.
---

# Figma 스펙 교차 QA (구현 후, 시각 QA 전)

```
3회 대조 → 구현
     ↓
[이 스킬] REST 스냅샷 ↔ MCP ↔ 코드 → 수정 루프
     ↓
figma-visual-qa (스크린샷)
```

MCP 하나만 보고 구현하면 MCP가 틀렸을 때 같이 틀린다. 노드 수치를 **다른 경로(REST)** 로 한 번 더 받아 대조한다.

## 1. 스냅샷 준비

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/fetch-node-spec.mjs" <fileKey> <nodeId> specs/figma/<nodeId>.json
```

경로는 `figma-to-code` §1 과 같다. `${CLAUDE_PLUGIN_ROOT}` 가 없으면 스크립트를 복사한 경로로 바꾼다.

결과는 노드마다 `size`, `sizing`(HUG·FILL·FIXED), `text`(font·size·weight·lineHeight·letterSpacing, 구간별 스타일 `runs`),
`fills`, `radius`, `layout`(gap·padding·정렬·wrap), `shadows`, `stroke`, `variables` 를 가진 평평한 목록이다.

- `sizing` 이 `HUG` 인 칩·뱃지는 코드에서도 내용 폭이어야 한다 (`w-fit`·`self-start`). block 기본값으로 카드 폭이 되면 fixed 대상.
- `runs` 가 있으면 한 텍스트 안에서 색·굵기가 바뀌는 구간이다. 구간마다 토큰을 따로 대조한다.

`FIGMA_TOKEN` 이 없으면 사용자에게 받거나, Figma Dev Mode 수치 캡처로 대체를 합의한다. 합의 전 완료 보고 금지.

## 2. 대조 표

같은 역할의 요소를 세 열에 맞춰 적는다. 이름이 다르면 **값**(hex·px·폰트 세트)으로 매칭하고 근거를 남긴다.

| 요소(역할) | REST 스냅샷 | MCP | 코드 토큰 | 결과 |
|---|---|---|---|---|
| 시트 타이틀 | 16/600/24 | 16/600/24 | `text-b2-semibold` | pass |
| 카드 gap | 20 | 20 | `gap-8` | **fixed → `gap-5`** |
| 헤더 그림자 | 없음 | 없음 | `shadow-bottom` | **fixed → 제거** |

## 3. QA 로그 (산출물)

스펙 문서나 PR 본문에 붙인다.

```markdown
## Figma Spec QA Log

- fileKey: `…` · nodeId: `…` · snapshot: `specs/figma/….json` · comparedAt: YYYY-MM-DD

### Pass
- 시트 타이틀 — REST 16/600/24 = MCP → `text-b2-semibold`

### Fixed
- 카드 gap — REST 20 vs 코드 `gap-8`(32) → `gap-5`

### Intentional
- 상단 그라데이션 범위 — 스크롤 컨테이너 구조 (한 줄 근거)

### Open
- (REST 에만 있음 / MCP 에만 있음 / 해석 불가)
```

## 4. 수정 루프

1. Fixed·Open 부터 코드 수정. 토큰만 쓰고 DS 내부는 건드리지 않는다.
2. 표를 다시 채운다. Open 이 0 이거나 Intentional 만 남을 때까지 반복.
3. 타이포 불일치면 `figma-to-code` 의 `references/token-mapping.md` 오매핑 원인 9가지를 점검.

## 금지

- REST 와 MCP 가 다른데 확인 없이 MCP 를 정본으로 고정 (Figma 재확인 또는 합의)
- `get_design_context` 참고 코드를 유일한 수치 소스로 쓰기
- 이 단계를 건너뛰고 시각 QA 로 바로 가기

다음: `figma-visual-qa`. 완료 보고에 `pass N / fixed N / intentional N / open N` 을 넣는다.
