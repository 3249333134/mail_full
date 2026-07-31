param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $InputPath).Path)
$output = New-Object System.Drawing.Bitmap($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
  for ($top = 0; $top -lt $source.Height; $top++) {
    for ($left = 0; $left -lt $source.Width; $left++) {
      $color = $source.GetPixel($left, $top)
      if ($color.A -ge 16 -and $color.R -gt 236 -and $color.G -gt 236 -and $color.B -gt 232) {
        # The slicer treats near-white as background. A one-channel clamp keeps
        # the heroine's ivory dress visible without a perceptible color shift.
        $color = [System.Drawing.Color]::FromArgb($color.A, $color.R, $color.G, 232)
      }
      $output.SetPixel($left, $top, $color)
    }
  }

  $parent = Split-Path $OutputPath -Parent
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  $output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $output.Dispose()
  $source.Dispose()
}
