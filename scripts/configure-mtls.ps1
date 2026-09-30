#requires -Version 7.0
[CmdletBinding()]
param(
    [ValidatePattern('^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$')]
    [string] $Hostname = 'pcln.top',
    [ValidatePattern('^[a-f0-9]{32}$')]
    [string] $ZoneId = '445dcc77acd395b2460d97c176fa3215',
    [switch] $Apply
)

$ErrorActionPreference = 'Stop'
$taskRepository = Split-Path -Parent $PSScriptRoot
$taskToken = $env:CLOUDFLARE_API_TOKEN
$taskAuthSource = 'environment'
if ([string]::IsNullOrWhiteSpace($taskToken)) {
    $taskAuthSource = 'wrangler-oauth'
    $taskAuthPath = Join-Path $env:APPDATA 'xdg.config\.wrangler\config\default.toml'
    if (-not (Test-Path -LiteralPath $taskAuthPath)) {
        throw 'Cloudflare credentials unavailable. Set CLOUDFLARE_API_TOKEN in this process.'
    }
    $taskAuthText = Get-Content -LiteralPath $taskAuthPath -Raw
    $taskMatch = [regex]::Match($taskAuthText, '(?m)^oauth_token\s*=\s*"([^"]+)"')
    if (-not $taskMatch.Success) { throw 'Wrangler OAuth token unavailable.' }
    $taskToken = $taskMatch.Groups[1].Value
}
$taskHeaders = @{ Authorization = 'Bearer ' + $taskToken }

function Invoke-CloudflareJson {
    param([string] $Method, [string] $Path, [object] $Body)
    $taskRequest = @{
        Method = $Method
        Uri = 'https://api.cloudflare.com/client/v4' + $Path
        Headers = $taskHeaders
        TimeoutSec = 30
        SkipHttpErrorCheck = $true
    }
    if ($null -ne $Body) {
        $taskRequest.ContentType = 'application/json'
        $taskRequest.Body = ConvertTo-Json -InputObject $Body -Depth 10 -Compress
    }
    try { $taskResponse = Invoke-RestMethod @taskRequest }
    catch { throw "Cloudflare transport failure for $Method $Path; no credentials are logged." }
    if ($taskResponse.success -ne $true) {
        $taskErrorCodes = @($taskResponse.errors | ForEach-Object { $_.code }) -join ','
        throw "Cloudflare rejected $Method $Path (codes: $taskErrorCodes). Host associations were not changed. The token needs Zone:SSL and Certificates:Edit and Zone:Zone:Read for this zone."
    }
    return $taskResponse
}

function Read-ManagedHostnames {
    $taskRead = Invoke-CloudflareJson -Method GET -Path "/zones/$ZoneId/certificate_authorities/hostname_associations"
    if ($null -eq $taskRead.result) { throw 'Cloudflare returned no association state; refusing to replace an unknown list.' }
    $taskHosts = @()
    if ($null -ne $taskRead.result.hostnames) { $taskHosts = @($taskRead.result.hostnames) }
    foreach ($taskHost in $taskHosts) {
        if ($taskHost -isnot [string] -or [string]::IsNullOrWhiteSpace($taskHost)) { throw 'Unexpected hostname entry; refusing to replace the association list.' }
    }
    return [pscustomobject]@{ response = $taskRead; hostnames = [string[]] $taskHosts }
}

$taskZone = Invoke-CloudflareJson -Method GET -Path "/zones/$ZoneId"
$taskZoneName = [string] $taskZone.result.name
if ($Hostname -ne $taskZoneName -and -not $Hostname.EndsWith('.' + $taskZoneName, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'The requested hostname does not belong to the selected zone.'
}
if ($taskZone.result.status -ne 'active') { throw 'The selected Cloudflare zone is not active.' }

$taskBaseline = Read-ManagedHostnames
if (-not $Apply) {
    [pscustomobject]@{ mode = 'inspect'; zone = $taskZoneName; hostname = $Hostname; auth_source = $taskAuthSource; enabled = $taskBaseline.hostnames -contains $Hostname; managed_ca_hostnames = $taskBaseline.hostnames } | ConvertTo-Json -Depth 5
    return
}

# Re-read immediately before the replacement, preserving other hosts. The API has no ETag/CAS.
$taskCurrent = Read-ManagedHostnames
if ($taskCurrent.hostnames -contains $Hostname) {
    [pscustomobject]@{ mode = 'apply'; hostname = $Hostname; enabled = $true; changed = $false; managed_ca_hostnames = $taskCurrent.hostnames } | ConvertTo-Json -Depth 5
    return
}
$taskBackupDirectory = Join-Path $taskRepository '.tmp'
New-Item -ItemType Directory -Path $taskBackupDirectory -Force | Out-Null
$taskBackupPath = Join-Path $taskBackupDirectory ('mtls-hostnames-before-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '.json')
[pscustomobject]@{ zone_id = $ZoneId; zone = $taskZoneName; hostname = $Hostname; read_at = [DateTime]::UtcNow.ToString('o'); cloudflare_managed_ca = $taskCurrent.response } | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $taskBackupPath -Encoding utf8
$taskMergedHosts = [string[]] (@($taskCurrent.hostnames) + @($Hostname))

# Deliberately omit mtls_certificate_id: this updates the managed CA only, preserving BYOCA.
$null = Invoke-CloudflareJson -Method PUT -Path "/zones/$ZoneId/certificate_authorities/hostname_associations" -Body @{ hostnames = $taskMergedHosts }
$taskVerified = Read-ManagedHostnames
if (-not ($taskVerified.hostnames -contains $Hostname)) { throw 'The hostname association was not present after the update.' }
foreach ($taskPreviousHost in $taskCurrent.hostnames) {
    if (-not ($taskVerified.hostnames -contains $taskPreviousHost)) { throw 'A pre-existing managed CA hostname is missing after the update; inspect the saved baseline.' }
}
[pscustomobject]@{ mode = 'apply'; hostname = $Hostname; enabled = $true; changed = $true; managed_ca_hostnames = $taskVerified.hostnames; backup = $taskBackupPath } | ConvertTo-Json -Depth 5
