#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.js ]] || [[ "$FILE_PATH" == *.css ]]; then
  cd "$CLAUDE_PROJECT_DIR/frontend" || exit 0
  npx prettier --write "$FILE_PATH" 2>/dev/null || true
fi

exit 0
