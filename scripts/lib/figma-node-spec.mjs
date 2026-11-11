// Figma REST 노드 트리를 QA 에 쓰기 좋은 평평한 스펙 목록으로 바꾼다.
// 결과 한 줄 = 노드 하나: 크기, 텍스트 스타일, 색, 반경, 간격, 그림자, 테두리, 바인딩된 변수.

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

function textSpec(node) {
  if (node.type !== 'TEXT' || !node.style) return undefined;
  const { fontFamily, fontSize, fontWeight, lineHeightPx, letterSpacing } = node.style;
  return {
    characters: node.characters,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight: lineHeightPx,
    letterSpacing,
    textAutoResize: node.style.textAutoResize,
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
  };
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
