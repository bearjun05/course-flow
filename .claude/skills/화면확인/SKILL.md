---
name: 화면확인
description: 개발 서버를 켜고 브라우저에서 현재 화면을 확인할 수 있도록 안내
disable-model-invocation: false
allowed-tools: Bash(cd frontend*), Bash(npm run dev*), Bash(lsof *)
---

사용자가 현재 만든 화면을 확인하고 싶어합니다.

1. 먼저 개발 서버가 이미 켜져있는지 확인: `lsof -i :3000 2>/dev/null`
2. 꺼져있으면 `cd frontend && npm run dev &` 로 백그라운드 실행
3. 사용자에게 안내:
   - "브라우저에서 http://localhost:3000 열어보시면 됩니다"
   - "수정한 내용은 새로고침하면 바로 반영돼요"
4. 특정 페이지를 보고 싶다면 해당 URL도 안내:
   - 대시보드: http://localhost:3000
   - 강의 상세: http://localhost:3000/projects/1
   - 제작 요청: http://localhost:3000/projects/new

기술 용어 쓰지 말고 쉽게 안내하세요.
