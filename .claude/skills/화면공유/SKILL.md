---
name: 화면공유
description: 변경사항을 인터넷에 올려서 다른 사람이 볼 수 있게 배포
disable-model-invocation: false
allowed-tools: Bash(cd frontend*), Bash(npm run build*), Bash(git *)
---

사용자가 만든 화면을 다른 사람에게 공유하고 싶어합니다.

1. 빌드 확인: `cd frontend && npm run build`
   - 실패하면 에러를 수정하고 다시 시도
2. 변경사항 저장:
   ```bash
   git add -A
   git commit -m "변경 내용을 한국어로 요약"
   git push
   ```
3. 사용자에게 안내:
   - "인터넷에 올렸습니다. 1~2분 후에 아래 링크에서 확인할 수 있어요"
   - "이 링크를 공유하시면 누구나 볼 수 있습니다: https://course-flow-lake.vercel.app/"
   - "컴퓨터에 아무것도 설치할 필요 없이 링크만 열면 됩니다"

기술 용어 쓰지 말고 쉽게 안내하세요. "배포", "커밋", "푸시" 같은 말 대신 "인터넷에 올리기", "저장", "반영" 등으로 표현.
