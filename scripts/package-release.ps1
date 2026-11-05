param([string]$OutputDirectory = "deliverables")
$ErrorActionPreference = "Stop"
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$out = [IO.Path]::GetFullPath((Join-Path $repoRoot $OutputDirectory))
if (-not $out.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar)) { throw "Output must remain inside the project." }
$staging = Join-Path $out ("staging-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
$full = Join-Path $staging "full"
$vercel = Join-Path $staging "vercel"
[IO.Directory]::CreateDirectory($full) | Out-Null
[IO.Directory]::CreateDirectory($vercel) | Out-Null
$directories = @("src", "scripts", "tests", "contracts", "docs", ".github", "deployment")
foreach ($name in $directories) {
    $source = Join-Path $repoRoot $name
    if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $full $name) -Recurse }
}
$names = @("package.json","package-lock.json","tsconfig.json","next-env.d.ts","next.config.ts","playwright.config.ts","vercel.json","Dockerfile","compose.yaml",".dockerignore",".gitignore",".env.example","README.md","DEVELOPMENT.md")
foreach ($name in $names) {
    $source = Join-Path $repoRoot $name
    if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $full $name) }
}
$reports = Join-Path $full "docs/release-validation"
[IO.Directory]::CreateDirectory($reports) | Out-Null
foreach ($name in @("redesign-build.log","redesign-unit.log","redesign-contracts.log","redesign-browser.log","redesign-live.log")) {
    $source = Join-Path $repoRoot ("artifacts/" + $name)
    if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $reports $name) }
}
foreach ($name in @("src","docs")) { Copy-Item -LiteralPath (Join-Path $full $name) -Destination (Join-Path $vercel $name) -Recurse }
foreach ($name in @("package.json","package-lock.json","tsconfig.json","next-env.d.ts","next.config.ts","vercel.json",".env.example")) { Copy-Item -LiteralPath (Join-Path $full $name) -Destination (Join-Path $vercel $name) }
$package = Get-Content -Raw -LiteralPath (Join-Path $vercel "package.json") | ConvertFrom-Json -AsHashtable
foreach ($key in @("test","test:contracts","test:e2e","worker")) { $package.scripts.Remove($key) }
[IO.File]::WriteAllText((Join-Path $vercel "package.json"), ($package | ConvertTo-Json -Depth 20))
Copy-Item -LiteralPath (Join-Path $full "docs/VERCEL-SETUP.md") -Destination (Join-Path $vercel "README.md")
$manifest = @{ packagedAt = (Get-Date).ToUniversalTime().ToString("o"); scope = "Read-only testnet beta; proposed token undeployed"; excludes = @("secrets","node_modules","build caches","wallet keys","worker state","Sites checkout"); full = "Source, contracts, tests, worker, VPS configuration and guides"; vercel = "Next.js web/API source and guides; persistent worker excluded" } | ConvertTo-Json -Depth 10
[IO.File]::WriteAllText((Join-Path $full "RELEASE-MANIFEST.json"), $manifest)
[IO.File]::WriteAllText((Join-Path $vercel "RELEASE-MANIFEST.json"), $manifest)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$fullZip = Join-Path $out "sentinelx-full.zip"
$vercelZip = Join-Path $out "sentinelx-vercel.zip"
foreach ($zip in @($fullZip,$vercelZip)) {
    if (Test-Path -LiteralPath $zip) {
        $resolved = [IO.Path]::GetFullPath($zip)
        if ([IO.Path]::GetDirectoryName($resolved) -ne $out) { throw "Invalid ZIP target." }
        Remove-Item -LiteralPath $resolved
    }
}
[IO.Compression.ZipFile]::CreateFromDirectory($full,$fullZip)
[IO.Compression.ZipFile]::CreateFromDirectory($vercel,$vercelZip)
$lines = foreach ($zip in @($fullZip,$vercelZip)) { $hash = Get-FileHash -LiteralPath $zip -Algorithm SHA256; "$($hash.Hash.ToLower())  $([IO.Path]::GetFileName($zip))" }
[IO.File]::WriteAllLines((Join-Path $out "SHA256SUMS.txt"),$lines)
Copy-Item -LiteralPath (Join-Path $full "docs/VPS-SETUP.md") -Destination (Join-Path $out "VPS-SETUP.md") -Force
Copy-Item -LiteralPath (Join-Path $full "docs/VERCEL-SETUP.md") -Destination (Join-Path $out "VERCEL-SETUP.md") -Force
Get-Item -LiteralPath $fullZip,$vercelZip | Select-Object FullName,Length
