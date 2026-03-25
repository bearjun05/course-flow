#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# 보호 대상 패턴
PROTECTED=(".env" "package-lock.json" ".next/" ".git/" "node_modules/")

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "보호된 파일입니다: $FILE_PATH 수정 불가" >&2
    exit 2
  fi
done

exit 0
