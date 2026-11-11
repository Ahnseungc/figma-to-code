---
name: figma-visual-qa
description: >-
  Visual QA of an implemented screen against the Figma get_screenshot baseline
  captured before implementation. Catches what token checks miss: wrapped labels in
  fixed-width chips, full-width badges that should hug, illustration and metallic
  color drift, last carousel slide, section background layers. Use after implementing
  a Figma design, or when the user says "디자인 QA", "시안이랑 비교", "visual QA",
  "pixel check", "스크린샷 대조".
---

# Figma 시각 QA

토큰·클래스 대조만 통과하고 끝내면 **사람 눈에 바로 보이는 차이**가 남는다. 구현 전에 남긴
`get_screenshot` 베이스라인과 실제 렌더를 나란히 놓고 한 번 더 본다.

## 1. 베이스라인 (구현 전)

- `get_design_context` 와 같은 `fileKey`·`nodeId` 로 `get_screenshot`. 이게 이번 작업의 기준이다.
- MCP가 스크린샷을 못 주면 사용자에게 Figma PNG export나 캡처를 받는다.
- 깊은 아이콘 노드 캡처가 **검게** 나오면 부모 프레임을 찍어 크롭한다. 빈 캡처로 "이상 없음" 처리 금지.

## 2. 실제 렌더 캡처

- 로컬·스테이징 화면, 또는 Storybook은 **`iframe.html?id=<story>&viewMode=story`** 만 캡처한다.
  manager UI나 프리뷰 위에 뜨는 모달에 가린 캡처로 FAIL 판정하지 않는다.
- 뷰포트 폭은 Figma 프레임 폭과 맞춘다.

## 3. 체크 항목

기본: 여백 · 정렬 · 반경 · 버튼 크기 · 타이포 위계 · 아이콘 비율 · 하단 고정 CTA · 시트 상단 곡률.

그리고 토큰 대조가 **자주 놓치는** 것들:

| 항목 | 확인 방법 | 함정 |
|---|---|---|
| 고정 폭 칩·버튼 라벨 | 칩만 크롭해서 한 줄인지 본다 | `scrollWidth === clientWidth` 는 wrap을 못 잡는다. 텍스트가 2줄로 감기면 가로 overflow는 0이다. `Range` 로 텍스트 높이를 재서 ≥ 1.5 × lineHeight 면 wrap |
| 고정 폭 카드 타이틀 | Figma에 `whitespace-nowrap`·줄 단위 `<p>` 가 있으면 구현도 줄마다 nowrap | 한국어는 강조 뒤 "해요"만 다음 줄 왼쪽으로 떨어진다 |
| 캐러셀·슬라이드 | **첫 장과 마지막 장 모두** | 마지막 장 카피가 길어서 깨지는 경우가 많다 |
| 내용 폭 칩(뱃지·태그) | 칩 크롭 + computed width/height/padding | `flex-col` 안 block이라 카드 전체 폭 바가 된다. 한글이 위로 붙으면 자간이 아니라 line-height |
| 일러스트·히어로 이미지 | Figma 노드 크롭 ↔ 구현 `img` 같은 크롭, 나란히 | 파일이 `public/` 에 있다는 것, SVG 바이트가 MCP와 같다는 것은 PASS 근거가 아니다 |
| 메탈릭·blend 색 | 기준/구현 불투명 픽셀 **평균 RGB** (채널당 ±15) + 모서리·중앙·하이라이트 샘플 | `mix-blend-mode` 는 Figma 캔버스와 브라우저 `<img>` 결과가 다르다. "비슷한 금색" 평탄 그라데이션으로 다시 그리면 채널당 +50 이상 밝아진다. 맞지 않으면 기준 PNG 크롭을 에셋으로 쓴다 |
| 페이지 배경 레이어 | 루트 배경 → 섹션 배경을 위에서 아래로 따라간다 | 루트 fill이 다른 회색으로 바뀌어 있거나 섹션 배경이 빠진 경우 |
| 하단 여백 위치 | footer에만 있던 padding이 루트로 퍼졌는지 | |
| 아이콘 | 보이는지가 아니라 **구간별 개수·위치** | 빈 `<pattern>` SVG, 다른 아이콘으로 대체 |

## 4. 차이 처리

- 토큰·클래스로 고칠 수 있으면 고친다.
- 스펙·레이아웃·CMS 때문에 의도적으로 다르면 **의도된 차이**로 한 줄 기록하고 1:1 강제하지 않는다
  (`figma-to-code` 스킬 §4).

## 5. 보고 형식

```
비교 노드: 12:345 (Home / Hero)
맞춘 항목: 칩 nowrap, 섹션 gap 20px→gap-5, 헤더 그림자 제거
의도된 차이: 상단 그라데이션을 헤더 영역으로 한정 (스크롤 컨테이너 구조)
남은 차이: 없음
```

베이스라인 없이 "느낌상 맞다"로 끝내지 않는다. 기준을 구할 수 없으면 그 한계를 보고에 적는다.

실패 사례 하나를 자세히 정리한 것: `references/case-missed-qa.md`
