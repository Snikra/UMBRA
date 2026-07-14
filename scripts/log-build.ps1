param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectDir,
    [string]$BuildArgs = "debug",
    [string]$ExtraArgs = "",
    [int]$LogRetentionDays = 30
)

# ============================================================
# Umbra Build Logger Engine
# ============================================================
# Executa o build do APK capturando TODO o output
# (stdout + stderr) com timestamps, categorizacao e rotacao.
# Toda operacao critica tem try/catch — nunca quebra.
# ============================================================

$ErrorActionPreference = "Continue"

# Script-scoped vars (precisa ser script: para eventos)
$script:LogsDir = Join-Path $ProjectDir "logs"
$script:Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$script:LogFile = Join-Path $script:LogsDir "build_$($script:Timestamp).log"
$script:SummaryFile = Join-Path $script:LogsDir "build_$($script:Timestamp).summary.json"
$script:StartTime = Get-Date
$script:WarningCount = 0
$script:ErrorCount = 0
$script:TotalLines = 0
$script:ExitCode = -1
$script:CriticalErrors = @()

# ============================================================
# Helpers (nunca lancam excecao)
# ============================================================
function Write-Log {
    param([string]$Level, [string]$Message)
    try {
        $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
        $Line = "[$now] [$Level] $Message"
        Add-Content -Path $script:LogFile -Value $Line -Encoding UTF8
        Write-Host $Line
    } catch {
        try { Write-Host "[FALLBACK] $Message" } catch {}
    }
}

function Write-Summary {
    try {
        $endTime = Get-Date
        $duration = $endTime - $script:StartTime
        $ce = $script:CriticalErrors
        if (-not $ce -or @($ce).Count -eq 0) { $ce = @() }
        $summary = @{
            timestamp           = $endTime.ToString("yyyy-MM-dd HH:mm:ss")
            build_time_seconds  = [math]::Round($duration.TotalSeconds, 2)
            exit_code           = $script:ExitCode
            total_lines         = $script:TotalLines
            warnings            = $script:WarningCount
            errors              = $script:ErrorCount
            log_file            = $script:LogFile
            success             = ($script:ExitCode -eq 0)
            critical_errors     = $ce
        }
        $json = $summary | ConvertTo-Json -Depth 3
        Set-Content -Path $script:SummaryFile -Value $json -Encoding UTF8
    } catch {
        try { Write-Host "[WARN] Falha ao gerar sumario: $_" } catch {}
    }
}

function Cleanup-OldLogs {
    param([string]$Dir, [int]$RetentionDays)
    try {
        $cutoff = (Get-Date).AddDays(-$RetentionDays)
        Get-ChildItem -Path $Dir -Filter "build_*.log" | Where-Object {
            $_.LastWriteTime -lt $cutoff
        } | ForEach-Object {
            try { Remove-Item $_.FullName -Force } catch {}
        }
        Get-ChildItem -Path $Dir -Filter "build_*.summary.json" | Where-Object {
            $_.LastWriteTime -lt $cutoff
        } | ForEach-Object {
            try { Remove-Item $_.FullName -Force } catch {}
        }
    } catch {}
}

function Write-EnvironmentInfo {
    Write-Log "INFO" "=============================="
    Write-Log "INFO" " Umbra Build Logger v1.0"
    Write-Log "INFO" "=============================="
    Write-Log "INFO" "Inicio: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Log "INFO" "Projeto: $ProjectDir"
    Write-Log "INFO" "Log: $script:LogFile"
    try {
        $javaVer = & java -version 2>&1
        Write-Log "INFO" "Java: $(($javaVer | Select-Object -First 1).Trim())"
    } catch { Write-Log "WARN" "Java nao encontrado no PATH" }
    try {
        $gradleVer = & "$ProjectDir\gradlew.bat" --version 2>&1 | Select-String "Gradle " | Select-Object -First 1
        if ($gradleVer) { Write-Log "INFO" "Gradle: $($gradleVer.ToString().Trim())" }
    } catch { Write-Log "WARN" "Nao foi possivel obter versao do Gradle" }
    Write-Log "INFO" "Build args: $BuildArgs"
    Write-Log "INFO" "=============================="
}

# ============================================================
# Pipeline de limpeza de logs antigos
# ============================================================
try {
    New-Item -ItemType Directory -Path $script:LogsDir -Force | Out-Null
    Cleanup-OldLogs -Dir $script:LogsDir -RetentionDays $LogRetentionDays
} catch {}

# ============================================================
# Inicio
# ============================================================
Write-EnvironmentInfo

# Determina qual comando executar
$BuildBat = Join-Path $ProjectDir "build-apk.bat"
$Gradlew = Join-Path $ProjectDir "gradlew.bat"
$BuildCmd = ""
$BuildArgsFull = ""

if (Test-Path $BuildBat) {
    $BuildCmd = $BuildBat
    $BuildCmdLabel = "build-apk.bat $BuildArgs"
    $ArgList = @($BuildArgs)
    if ($ExtraArgs) { $ArgList += $ExtraArgs.Split(' ', [StringSplitOptions]::RemoveEmptyEntries) }
    $ArgString = ($ArgList | ForEach-Object { "$_" }) -join " "
} elseif (Test-Path $Gradlew) {
    $BuildCmd = $Gradlew
    if ($BuildArgs -eq "release") {
        $ArgString = "assembleRelease"
    } else {
        $ArgString = "assembleDebug"
    }
    $BuildCmdLabel = "gradlew.bat $ArgString"
} else {
    Write-Log "ERROR" "Nenhum script de build encontrado (build-apk.bat ou gradlew.bat)"
    exit 1
}

Write-Log "INFO" "Executando: $BuildCmdLabel"
Write-Log "INFO" "--- output do build ---"

# ============================================================
# Execucao do processo com captura em tempo real
# ============================================================
try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c `"$BuildCmd`" $ArgString"
    $psi.WorkingDirectory = $ProjectDir
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi

    # Action blocks para stdout e stderr — salvam no mesmo arquivo log.
    # NOTA: Event handlers rodam em escopo isolado. $script: ali nao e o
    # mesmo $script: daqui. Por isso as estatisticas sao recalculadas
    # a partir do arquivo de log apos o processo terminar (linha ~207).
    $outputEvent = Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        $line = $EventArgs.Data
        if (-not $line) { return }
        try {
            $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
            $Formatted = "[$now] [BUILD] $line"
            Add-Content -Path $event.MessageData.LogFile -Value $Formatted -Encoding UTF8
            Write-Host $line
        } catch {
            try { Write-Host $line } catch {}
        }
    } -MessageData @{ LogFile = $script:LogFile }

    $errorEvent = Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        $line = $EventArgs.Data
        if (-not $line) { return }
        try {
            $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
            $Formatted = "[$now] [STDERR] $line"
            Add-Content -Path $event.MessageData.LogFile -Value $Formatted -Encoding UTF8
            Write-Host "[STDERR] $line" -ForegroundColor Red
        } catch {
            try { Write-Host "[STDERR] $line" -ForegroundColor Red } catch {}
        }
    } -MessageData @{ LogFile = $script:LogFile }

    $null = $proc.Start()
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()
    $proc.WaitForExit()
    $script:ExitCode = $proc.ExitCode

    # Desregistra eventos
    try { Unregister-Event -SourceIdentifier $outputEvent.Name -ErrorAction SilentlyContinue } catch {}
    try { Unregister-Event -SourceIdentifier $errorEvent.Name -ErrorAction SilentlyContinue } catch {}
    try { $proc.Dispose() } catch {}

    # Recalcula estatisticas a partir do arquivo de log (event handlers
    # rodam em escopo separado e nao compartilham $script:).
    try {
        if (Test-Path $script:LogFile) {
            $script:LogContent = Get-Content $script:LogFile
            $script:TotalLines = $script:LogContent.Count
            $script:WarningCount = @($script:LogContent | Select-String "\[WARN\]").Count
            $script:ErrorCount = @($script:LogContent | Select-String "\[(ERROR|STDERR)\]").Count
            $criticalMatches = $script:LogContent | Select-String "\[(ERROR|STDERR)\]" | ForEach-Object { $_.Line }
            $script:CriticalErrors = if ($criticalMatches) { @($criticalMatches) } else { @() }
        }
    } catch {
        Write-Log "WARN" "Nao foi possivel recalcular estatisticas: $_"
    }

} catch {
    $script:ExitCode = -1
    Write-Log "ERROR" "Excecao ao executar build: $_"
}

# ============================================================
# Finalizacao
# ============================================================
Write-Log "INFO" "--- fim do output do build ---"

if ($script:ExitCode -eq 0) {
    Write-Log "INFO" "Build concluido com SUCESSO (exit code: 0)"
} else {
    Write-Log "ERROR" "Build FALHOU (exit code: $($script:ExitCode))"
}

if ($script:WarningCount -gt 0) {
    Write-Log "WARN" "Total de warnings: $script:WarningCount"
}
if ($script:ErrorCount -gt 0) {
    Write-Log "ERROR" "Total de erros: $script:ErrorCount"
}

Write-Summary
Write-Log "INFO" "Log salvo em: $script:LogFile"
Write-Log "INFO" "Sumario salvo em: $script:SummaryFile"
$duration = [math]::Round(((Get-Date) - $script:StartTime).TotalSeconds, 2)
Write-Log "INFO" "Duracao: ${duration}s"
Write-Log "INFO" "=============================="

exit $script:ExitCode
