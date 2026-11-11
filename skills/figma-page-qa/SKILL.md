---
name: figma-page-qa
description: >-
  Full-page visual parity check against a Figma frame for long, multi-section screens
  (mobile web, WebView, landing pages). Focuses on background color layers per section
  and missing or swapped icons, which component-level QA misses. Use for "페이지 전체 QA",
  "배경색이 달라", "아이콘 빠졌어", "웹뷰 디자인 QA", "full page QA".
---

# Figma 페이지 전체 QA — 배경 레이어 · 아이콘 누락

컴포넌트 단위 QA는 통과했는데 페이지로 보면 **배경색 단절**이나 **아이콘 누락**이 남는 경우가 많다.

## 절차

1. **기준 수집** — `get_design_context` + `get_screenshot`, 섹션 경계가 필요하면 `get_metadata`.
   이때 아이콘 에셋 중 `.svg` 후보 목록을 먼저 만든다.
2. **배경 레이어 표** — 위에서 아래로 구간을 나눠 `Figma fill ↔ 코드 배경 토큰` 을 적는다.
   페이지 루트와 각 섹션을 따로 본다.

   | 구간 | Figma fill | 코드 | 결과 |
   |---|---|---|---|
   | 루트 | `#F7F7F8` | `bg-bg-secondary` | pass |
   | 히어로 | gradient(…) | `bg-gradient-…` | pass |
   | 혜택 섹션 | `#FFFFFF` | (없음 — 루트 색 노출) | **fail** |

3. **아이콘 인벤토리 표** — Figma 아이콘(이름·개수·구간) ↔ 코드 import·렌더 분기 1:1.
   `.svg` 를 못 구한 항목은 **누락**으로 표시하고 export 대상으로 올린다.
4. **나란히 보기** — 구현 캡처와 기준 캡처에서 배경 전환 지점, 아이콘 존재·크기·정렬을 본다.
5. **수정 우선순위** — ① 배경 누락·오염 ② 아이콘 미노출 ③ 크기·정렬. 고친 뒤 4로 돌아간다.

## 체크

- 루트 배경이 Figma 최상위 fill과 같은 토큰인가
- 음수 마진(`-mx-*`)으로 넓힌 구간에 흰 띠나 색 단절이 없는가
- 아이콘이 래스터 `<img>` 로 우회되지 않았는가
- **특정 상태**(로그인/비로그인, 빈 목록 등)에서만 아이콘이 사라지는 분기가 없는가
- 점 마커 리스트가 `border-l` 막대로 바뀌지 않았는가
- Figma에 없는 카드 border가 `ul > li` 구조라는 이유로 추가되지 않았는가
- footer에만 있던 하단 padding이 루트 전체로 퍼지지 않았는가
- 헤더 우측 액션이 텍스트인지 pill 버튼(아이콘+텍스트)인지
- 라벨+값이 한 줄 인라인인지 두 줄 스택인지
- 비활성 CTA: 문구가 같아도 색 토큰·높이를 비교
- 3D 일러스트는 레이어만 export하면 rotate·flip·crop이 빠진다. 합성 박스 프레임째로 export

## 관련

- 컴포넌트 단위 시각 QA: `figma-visual-qa`
- 에셋 일괄 export: `scripts/export-assets.mjs` + 매니페스트
