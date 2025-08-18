#!/usr/bin/env bash
set -e
Q="quiz.html"
G="goal.html"

ensure_tag () {
  local file="$1"; shift
  local tag="$1"
  if ! grep -Fq "$tag" "$file"; then
    # insert before </head>
    awk -v add="$tag" 'BEGIN{done=0} /<\/head>/{print add; done=1} {print} END{if(done==0)print add}' "$file" > "$file.__tmp__" && mv "$file.__tmp__" "$file"
    echo "[+] injected into $file: $tag"
  else
    echo "[=] already present in $file: $tag"
  fi
}

ensure_nav () {
  local file="$1"
  local nav='<!-- SOI-NAV-BEGIN --><nav><a href="/">홈</a> | <a href="/quiz.html">퀴즈</a> | <a href="/pages/shop.html">상점</a> | <a href="/pages/logs.html">기록</a></nav><!-- SOI-NAV-END -->'
  if ! grep -Fq "SOI-NAV-BEGIN" "$file"; then
    awk -v add="$nav" 'NR==1,/<body[^>]*>/{print} /<body[^>]*>/{print add; next} NR>1{print}' "$file" > "$file.__tmp__" && mv "$file.__tmp__" "$file"
    echo "[+] nav added in $file"
  else
    echo "[=] nav exists in $file"
  fi
}

for f in "$Q" "$G"; do
  test -f "$f" || { echo "[-] not found: $f"; continue; }
  ensure_nav "$f"
done

test -f "$Q" && {
  ensure_tag "$Q" '<script src="/js/config.js"></script>'
  ensure_tag "$Q" '<script src="/js/core-auth-store.js"></script>'
  ensure_tag "$Q" '<script src="/js/drop.js"></script>'
  ensure_tag "$Q" '<script src="/js/sheets.js"></script>'
}

test -f "$G" && {
  ensure_tag "$G" '<script src="/js/config.js"></script>'
  ensure_tag "$G" '<script src="/js/core-auth-store.js"></script>'
  ensure_tag "$G" '<script src="/js/drop.js"></script>'
}

echo "[OK] Injection completed."
