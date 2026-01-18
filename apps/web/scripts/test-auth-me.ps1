$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/me" `
  -WebSession $s `
  -Method GET
