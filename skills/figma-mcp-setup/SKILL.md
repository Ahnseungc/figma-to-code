---
name: figma-mcp-setup
description: >-
  Connects to Figma for design reading: prefers the local Figma desktop Dev Mode MCP
  server (http://127.0.0.1:3845/mcp), falls back to raw HTTP calls when the client has
  not registered it, and only then to the remote Figma MCP. Use when Figma MCP tools
  are missing or failing, on "connection refused 3845", rate limits, or when setting
  up Figma MCP for the first time.
---

# Figma MCP 연결

## 우선순위

| 순위 | 서버 | 쓰는 경우 |
|---|---|---|
| 1 | **로컬 Dev Mode MCP** `http://127.0.0.1:3845/mcp` (Figma 데스크톱 앱) | 읽기·QA 기본 경로. 한도 걱정이 적고 빠르다 |
| 2 | 같은 서버를 **HTTP로 직접 호출** | 클라이언트에 등록이 안 돼 있을 때. 원격으로 바로 넘어가지 않는다 |
| 3 | 원격 Figma MCP | 로컬을 띄울 수 없을 때만. 좌석에 따라 rate limit이 잦다 |

## 등록

Figma 데스크톱 → Dev Mode → MCP 서버 활성화 후:

```bash
claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

Cursor는 `~/.cursor/mcp.json`:

```json
{ "mcpServers": { "Figma": { "url": "http://127.0.0.1:3845/mcp" } } }
```

## 읽기 순서

URL `...?node-id=12-345` → `nodeId` `12:345`.

1. `get_design_context` — 레이아웃·참고 코드 (`clientLanguages`, `clientFrameworks` 를 넘길 수 있다)
2. `get_screenshot` — 시각 기준
3. `get_metadata` — 프레임 크기·자식 구조
4. `get_variable_defs` — 변수 이름 ↔ 값

## HTTP 직접 호출

```bash
# 1) initialize → 세션 ID
curl -sS -D /tmp/figma_hdr.txt -X POST http://127.0.0.1:3845/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"agent","version":"1.0"}}}'
SID=$(awk -F': ' 'tolower($1)=="mcp-session-id"{print $2}' /tmp/figma_hdr.txt | tr -d '\r')

# 2) initialized 알림
curl -sS -X POST http://127.0.0.1:3845/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -H "Mcp-Session-Id: $SID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' >/dev/null

# 3) 도구 호출
curl -sS -X POST http://127.0.0.1:3845/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -H "Mcp-Session-Id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_design_context","arguments":{"nodeId":"12:345","clientLanguages":"typescript","clientFrameworks":"react"}}}'
```

응답은 SSE다. `data: {...}` 줄을 파싱해 `result.content` 의 text·image를 쓴다. 같은 턴에서는 세션을 재사용한다.

## 주의

- `http://localhost:3845/assets/...` 는 세션 임시 URL. 코드·mock에 남기지 않는다.
- 스크린샷 base64는 크다. 파일로 저장한 뒤 이미지로 읽는다.

## 문제 해결

| 증상 | 조치 |
|---|---|
| `connection refused :3845` | Figma 데스크톱 앱에서 해당 파일을 열고 Dev Mode MCP를 켠다 |
| 클라이언트에 Figma 도구가 없음 | 위 HTTP 호출로 진행 |
| 원격 MCP rate limit | 로컬로 다시 시도 |
| 노드를 못 찾음 | 데스크톱 앱에 **그 파일**이 열려 있는지 확인 |
