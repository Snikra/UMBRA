function Extract-DocxToText {
    param (
        [string]$Path
    )

    $outPath = $Path -replace '\.docx$', '.txt'
    if (Test-Path $outPath) { Remove-Item $outPath -Force }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zipPath = $Path -replace '\.docx$', '.zip'
    Copy-Item -LiteralPath $Path -Destination $zipPath -Force
    
    $extPath = $Path -replace '\.docx$', '_ext'
    if (Test-Path $extPath) { Remove-Item $extPath -Recurse -Force }
    
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extPath)
    
    $xmlPath = Join-Path $extPath 'word\document.xml'
    $content = Get-Content -LiteralPath $xmlPath -Raw
    
    $text = [regex]::Matches($content, '(?<=<w:t.*?>).*?(?=</w:t>)') | ForEach-Object { $_.Value }
    $text -join '' | Out-File -FilePath $outPath -Encoding UTF8

    Remove-Item $zipPath -Force
    Remove-Item $extPath -Recurse -Force
}

$dir = 'C:\Users\gustavo.ben.IMCOPA\Documents\PROJETOS\UMBRA\SNIKRA\unzipped\RPG\Snikra'
$files = Get-ChildItem -Path $dir -Filter '*.docx'
foreach ($f in $files) {
    Extract-DocxToText -Path $f.FullName
}
