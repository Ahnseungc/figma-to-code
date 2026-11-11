---
name: design-reuse-first
description: >-
  Before building UI from a Figma design or spec, searches the design system and shared
  components first, then composes or wraps them; creates a new component only when
  nothing fits and never edits the design system source without an explicit request.
  Use during figma-to-code pass 2, or for "공통 컴포넌트 있나", "DS 재사용", "reuse".
---

# 재사용 우선

Figma MCP가 주는 범용 React를 그대로 넣으면 이미 있는 Button·Modal을 다시 만든다.

## 1. 찾기

1. 디자인에서 요소의 **역할**을 이름으로 적는다 — "주요 CTA", "하단 고정 바", "확인 모달".
2. 디자인 시스템 폴더(토큰 맵의 DS 위치)에서 같은 역할 검색 — 디렉터리명, export 이름.
3. DS 밖 공통 컴포넌트 폴더에서 유사 패턴.
4. 같은 기능 영역에 이미 있는 카드·리스트.
5. Figma 라이브러리 컴포넌트면 `search_design_system` 으로 원본 확인.

## 2. 있으면

- import 해서 조합한다. variant·size props가 있으면 그걸 쓴다.
- 몇 px 어긋나면 **래퍼에서 토큰 클래스로만** 보정한다. DS 소스는 고치지 않는다.

## 3. 없으면

- 역할이 드러나는 이름으로 새로 만든다.
- 가능하면 DS 조각 + 레이아웃만으로 끝낸다. 새 원자 컴포넌트는 최소로.
- 두 번째 화면에서도 쓰이면 공통 위치로 옮기자고 제안한다.

## 보고

"기존 `X` 를 썼다" 또는 "없어서 `Y` 를 새로 만들었다"를 한 줄이라도 남긴다.
