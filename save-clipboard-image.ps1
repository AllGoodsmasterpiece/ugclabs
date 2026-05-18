Add-Type -AssemblyName System.Windows.Forms,System.Drawing

$img = [Windows.Forms.Clipboard]::GetImage()
if (-not $img) {
    throw "Clipboard does not contain an image."
}

$path = Join-Path $env:TEMP ("codex-clip-{0:yyyyMMdd-HHmmss}.png" -f (Get-Date))
$img.Save($path, [Drawing.Imaging.ImageFormat]::Png)
$path | Set-Clipboard
Write-Output $path
