# Windows PowerShell injector
$Q = "quiz.html"
$G = "goal.html"

function Ensure-Tag([string]$file, [string]$tag) {
  if (!(Select-String -LiteralPath $file -Pattern [regex]::Escape($tag) -Quiet)) {
    $content = Get-Content -LiteralPath $file -Raw
    if ($content -match "</head>") {
      $content = $content -replace "</head>", ($tag + "`r`n</head>")
    } else {
      $content = $content + "`r`n" + $tag
    }
    Set-Content -LiteralPath $file -Value $content -Encoding UTF8
    Write-Output "[+] injected into $file: $tag"
  } else {
    Write-Output "[=] already present in $file: $tag"
  }
}

function Ensure-Nav([string]$file) {
  $nav = '<!-- SOI-NAV-BEGIN --><nav><a href="/">홈</a> | <a href="/quiz.html">퀴즈</a> | <a href="/pages/shop.html">상점</a> | <a href="/pages/logs.html">기록</a></nav><!-- SOI-NAV-END -->'
  if (!(Select-String -LiteralPath $file -Pattern "SOI-NAV-BEGIN" -Quiet)) {
    $content = Get-Content -LiteralPath $file -Raw
    if ($content -match "<body[^>]*>") {
      $content = $content -replace "(<body[^>]*>)", ("`$1`r`n" + $nav)
    } else {
      $content = $nav + "`r`n" + $content
    }
    Set-Content -LiteralPath $file -Value $content -Encoding UTF8
    Write-Output "[+] nav added in $file"
  } else {
    Write-Output "[=] nav exists in $file"
  }
}

foreach ($f in @($Q,$G)) {
  if (Test-Path $f) { Ensure-Nav $f } else { Write-Output "[-] not found: $f" }
}

if (Test-Path $Q) {
  Ensure-Tag $Q '<script src="/js/config.js"></script>'
  Ensure-Tag $Q '<script src="/js/core-auth-store.js"></script>'
  Ensure-Tag $Q '<script src="/js/drop.js"></script>'
  Ensure-Tag $Q '<script src="/js/sheets.js"></script>'
}
if (Test-Path $G) {
  Ensure-Tag $G '<script src="/js/config.js"></script>'
  Ensure-Tag $G '<script src="/js/core-auth-store.js"></script>'
  Ensure-Tag $G '<script src="/js/drop.js"></script>'
}

Write-Output "[OK] Injection completed."
