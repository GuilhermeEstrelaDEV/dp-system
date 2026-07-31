$ErrorActionPreference = 'Stop'

$pptxPath = [System.IO.Path]::GetFullPath('docs/presentation/generated/DP-System_MVP-001_Executive_Deck.pptx')
$pdfPath = [System.IO.Path]::GetFullPath('docs/presentation/generated/DP-System_MVP-001_Executive_Deck.pdf')

if (-not (Test-Path -LiteralPath $pptxPath)) {
  throw "PPTX não encontrado: $pptxPath"
}

$powerPoint = $null
$presentation = $null
try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $presentation = $powerPoint.Presentations.Open($pptxPath, $true, $false, $false)
  if ($presentation.Slides.Count -ne 15) {
    throw "Quantidade inesperada de slides: $($presentation.Slides.Count)"
  }
  $presentation.SaveAs($pdfPath, 32)
  Write-Output "[presentation] PowerPoint abriu 15 slides sem erro estrutural."
  Write-Output "[presentation] PDF exportado: $pdfPath"
}
finally {
  if ($null -ne $presentation) { $presentation.Close() }
  if ($null -ne $powerPoint) { $powerPoint.Quit() }
  if ($null -ne $presentation) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
  if ($null -ne $powerPoint) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
