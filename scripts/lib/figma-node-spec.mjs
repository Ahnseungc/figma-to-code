// Figma REST 노드 트리를 QA 에 쓰기 좋은 평평한 스펙 목록으로 바꾼다.
// 결과 한 줄 = 노드 하나: 크기·sizing, 텍스트 스타일(구간별 runs), 색, 반경, 간격·정렬, 그림자, 테두리, 바인딩된 변수.

const CHANNEL_MAX = 255;

function toHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => Math.round(value * CHANNEL_MAX).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function paintToSpec(paint) {
  if (paint.visible === false) return null;
  if (paint.type === 'SOLID') {
    const alpha = (paint.color.a ?? 1) * (paint.opacity ?? 1);
    return alpha < 1 ? `${toHex(paint.color)} ${Math.round(alpha * 100)}%` : toHex(paint.color);
  }
  if (paint.type.startsWith('GRADIENT')) {
    return `${paint.type.toLowerCase()}(${paint.gradientStops.map((s) => toHex(s.color)).join(' → ')})`;
  }
  return paint.type.toLowerCase();
}

function paintsToSpec(paints) {
  const specs = (paints ?? []).map(paintToSpec).filter(Boolean);
  return specs.length ? specs : undefined;
}

const BASE_STYLE_ID = 0;

function typeStyleToSpec(style) {
  const { fontFamily, fontSize, fontWeight, lineHeightPx, letterSpacing } = style;
  return { fontFamily, fontSize, fontWeight, lineHeight: lineHeightPx, letterSpacing };
}

/** 한 텍스트 안에서 스타일이 바뀌는 구간 (예: 강조 색·굵기). 기본 스타일 구간은 뺀다. */
function textRunsSpec(node) {
  const overrides = node.characterStyleOverrides ?? [];
  const table = node.styleOverrideTable ?? {};
  const runs = [];
  let start = 0;

  for (let index = 1; index <= overrides.length; index += 1) {
    if (index < overrides.length && overrides[index] === overrides[start]) continue;

    const style = table[overrides[start]];
    if (overrides[start] !== BASE_STYLE_ID && style) {
      const spec = Object.fromEntries(
        Object.entries({ ...typeStyleToSpec(style), fills: paintsToSpec(style.fills) }).filter(
          ([, value]) => value !== undefined,
        ),
      );
      runs.push({ characters: node.characters.slice(start, index), ...spec });
    }
    start = index;
  }

  return runs.length ? runs : undefined;
}

function textSpec(node) {
  if (node.type !== 'TEXT' || !node.style) return undefined;
  return {
    characters: node.characters,
    ...typeStyleToSpec(node.style),
    textAutoResize: node.style.textAutoResize,
    runs: textRunsSpec(node),
  };
}

function radiusSpec(node) {
  if (node.rectangleCornerRadii) return node.rectangleCornerRadii;
  return node.cornerRadius || undefined;
}

function layoutSpec(node) {
  if (!node.layoutMode || node.layoutMode === 'NONE') return undefined;
  return {
    direction: node.layoutMode,
    gap: node.itemSpacing,
    padding: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft].map(
      (value) => value ?? 0,
    ),
    align: [node.primaryAxisAlignItems ?? 'MIN', node.counterAxisAlignItems ?? 'MIN'],
    wrap: node.layoutWrap === 'WRAP' ? { rowGap: node.counterAxisSpacing ?? 0 } : undefined,
  };
}

/** auto layout 안에서의 폭·높이 방식. HUG 칩이 코드에서 카드 폭(block)이 되는 실수를 잡는다. */
function sizingSpec(node) {
  const { layoutSizingHorizontal: horizontal, layoutSizingVertical: vertical } = node;
  if (!horizontal && !vertical) return undefined;
  return [horizontal ?? 'FIXED', vertical ?? 'FIXED'];
}

function shadowSpec(node) {
  const shadows = (node.effects ?? [])
    .filter((effect) => effect.visible !== false && effect.type.endsWith('SHADOW'))
    .map((effect) => ({
      type: effect.type,
      x: effect.offset?.x,
      y: effect.offset?.y,
      blur: effect.radius,
      spread: effect.spread ?? 0,
      color: paintToSpec({ type: 'SOLID', color: effect.color }),
    }));
  return shadows.length ? shadows : undefined;
}

function strokeSpec(node) {
  const colors = paintsToSpec(node.strokes);
  if (!colors) return undefined;
  return { colors, weight: node.strokeWeight };
}

function nodeToSpec(node) {
  const box = node.absoluteBoundingBox;
  const spec = {
    id: node.id,
    name: node.name,
    type: node.type,
    size: box ? [Math.round(box.width), Math.round(box.height)] : undefined,
    sizing: sizingSpec(node),
    text: textSpec(node),
    fills: paintsToSpec(node.fills),
    radius: radiusSpec(node),
    layout: layoutSpec(node),
    shadows: shadowSpec(node),
    stroke: strokeSpec(node),
    variables: node.boundVariables && Object.keys(node.boundVariables).length
      ? Object.keys(node.boundVariables)
      : undefined,
  };
  return Object.fromEntries(Object.entries(spec).filter(([, value]) => value !== undefined));
}

/** 노드 트리를 깊이 우선으로 펼친다. 숨긴 노드는 건너뛴다. */
export function flattenNodeSpec(root) {
  const result = [];
  const visit = (node, depth) => {
    if (node.visible === false) return;
    result.push({ depth, ...nodeToSpec(node) });
    for (const child of node.children ?? []) visit(child, depth + 1);
  };
  visit(root, 0);
  return result;
}
