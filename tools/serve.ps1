param(
  [int]$Port = 8080,
  [string]$Root = (Join-Path $PSScriptRoot '..')
)

# 로컬 미리보기용 정적 서버. 설치할 것이 없고, 내 PC(localhost)에서만 열린다.
$rootPath = (Resolve-Path $Root).Path
$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $rootPath at http://localhost:$Port/"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '') { $rel = 'index.html' }
      $full = [IO.Path]::GetFullPath((Join-Path $rootPath $rel))
      $inside = $full.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)
      if ($inside -and (Test-Path -LiteralPath $full -PathType Leaf)) {
        $ext = [IO.Path]::GetExtension($full).ToLower()
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $bytes = [IO.File]::ReadAllBytes($full)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
      }
    } catch {
      $res.StatusCode = 500
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
}
