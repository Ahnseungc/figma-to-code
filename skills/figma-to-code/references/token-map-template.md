# Figma → 코드 토큰 맵

> 이 파일을 프로젝트의 `.claude/figma-to-code.md` 로 복사해 채운다.
> 모르는 칸은 비워 둔다. 에이전트는 빈 칸을 추측하지 않고 묻는다.

## 스택

- 스타일 방식: <!-- Tailwind v4 @theme / Tailwind v3 config / CSS Modules + CSS 변수 / styled-components theme / vanilla-extract ... -->
- 토큰 정의 파일: <!-- 예: styles/typography.css, styles/color.css, tailwind.config.ts, src/theme/tokens.ts -->
- 클래스 병합 유틸: <!-- 예: cn() from lib/utils -->

## 타이포그래피

- 사용 형태: <!-- 예: text-{계층}-{굵기} → text-h1-bold, text-b2-regular -->
- 계층 목록과 수치(크기/행간/자간/굵기):

| 토큰 | size | line-height | letter-spacing | weight |
|---|---|---|---|---|
| <!-- text-h1-bold --> | | | | |

- 없는 조합: <!-- 예: b 계층에는 -medium 없음 -->
- 금지: <!-- 예: text-sm, font-bold 단독, text-[Npx] -->

## 색

- 텍스트: <!-- 예: text-text-default, text-text-secondary -->
- 배경: <!-- 예: bg-bg-default, bg-bg-secondary -->
- 선: <!-- 예: border-line-default -->
- Figma 변수 ↔ 코드 토큰 규칙: <!-- 예: Figma "text/primary" → text-text-primary -->
- 임의 Hex 허용 여부: <!-- 기본: 금지 -->

## 간격

- 기본 단위: <!-- 4px → gap-5 = 20px -->
- Figma 변수 이름 규칙: <!-- 예: spacing-200 = 20px (숫자 ÷ 10). 이름의 숫자를 클래스에 그대로 쓰지 않는다 -->

| Figma | px | 코드 |
|---|---|---|
| <!-- spacing-200 --> | 20 | <!-- gap-5 / p-5 --> |

## 반경 · 그림자

- 반경 유틸: <!-- 예: rounded-80 = 8px, 개별 모서리 rounded-tr-0 -->
- 그림자 유틸: <!-- 예: shadow-top, shadow-bottom. 맞는 게 없으면 의미 있는 이름으로 새 유틸 추가 -->

## 컴포넌트 · 아이콘 · 에셋

- DS 컴포넌트 위치: <!-- 예: components/ds/ (수정 금지, 조합만) -->
- 버튼/모달/바텀시트 등 우선 사용 컴포넌트: <!-- -->
- 아이콘 폴더와 형식: <!-- 예: components/icons/<domain>/*.tsx, viewBox + currentColor -->
- 이미지 위치: <!-- 예: public/images/<feature>/ 또는 CDN -->

## 프로젝트 고유 규칙

<!-- 레이아웃 셸, 하단 고정 CTA, safe-area, 최대 폭 등 Figma에 안 보이는 제약 -->
