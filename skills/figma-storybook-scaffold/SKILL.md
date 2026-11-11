---
name: figma-storybook-scaffold
description: >-
  From a Figma URL, scaffolds Storybook stories first (with the Figma link in
  parameters and a uiState control for page states), then implements the UI against
  them. Keeps the Figma node attached to the story so reviewers and agents always QA
  against the same node. Use when the user pastes a Figma link and mentions Storybook,
  "스토리부터", "스토리 스캐폴드", "parameters.figma".
---

# Figma URL → Storybook 스캐폴드 → 구현

스토리를 **계약**으로 먼저 만들고 그다음 구현한다. Figma 링크는 스펙 문서가 아니라 **스토리 parameters** 에 둔다.
그래야 디자이너·리뷰어·에이전트가 같은 노드를 기준으로 본다.

## 순서

1. Figma MCP로 `get_design_context` + `get_screenshot` (`figma-to-code` §1).
2. **스토리 스캐폴드** — 구현 전에, 같은 작업 단위에서:
   - 컴포넌트 옆에 `*.stories.tsx`
   - `tags: ['autodocs']`
   - `parameters.design` (storybook-addon-designs) 또는 프로젝트 헬퍼로 Figma URL
   - 페이지 컴포넌트면 `uiState` 컨트롤(`default`, `loading`, `empty`, `error` …) + mock 초안
3. Canvas/Docs에서 Figma 링크가 보이는지 확인.
4. `figma-to-code` 로 구현.
5. mock·`uiState`·`play`·테스트·디자인 QA를 같은 작업에서 맞춘다.
6. 완료 보고에 **스토리 경로 + Figma URL**.

## parameters 예시

```ts
import type { Meta, StoryObj } from '@storybook/react';

import { RouletteView } from './RouletteView';

const FIGMA_URL = 'https://www.figma.com/design/FILE_KEY/?node-id=12-345';

const meta = {
  title: 'pages/Roulette',
  component: RouletteView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: FIGMA_URL },
    docs: { description: { component: `[Figma](${FIGMA_URL}) · 룰렛 메인` } },
  },
  argTypes: {
    uiState: { control: 'radio', options: ['default', 'loading', 'empty', 'error'] },
  },
  args: { uiState: 'default' },
} satisfies Meta<typeof RouletteView>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
```

프로젝트에 헬퍼가 있으면 그걸 쓴다. 없으면 위처럼 직접 넣고, 반복되면 헬퍼로 뺀다.

## 체크

```
- [ ] parameters 에 Figma URL
- [ ] 페이지면 uiState 컨트롤 + Default
- [ ] 아토믹 컴포넌트면 컴포넌트 폴더에 stories 동반
- [ ] 이벤트 리스너만 있는 Gate/Provider 류는 스토리로 만들지 않는다
- [ ] 시각 QA 캡처는 iframe.html?id=…&viewMode=story (manager UI 말고)
```

## 금지

- Figma URL을 스펙 md에만 두고 스토리에서 생략
- 문구·카피를 "Lorem"으로 채운 mock. 실제 카피나 Figma 카피를 쓴다
