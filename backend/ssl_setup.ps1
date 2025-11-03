# SSL Certificate Generation Script for Windows PowerShell# SSL Certificate Generation Script for Windows PowerShell

# This script generates self-signed SSL certificates for local development# This script generates self-signed SSL certificates for local development



Write-Host "SSL Certificate Generator for Developer Portfolio" -ForegroundColor CyanWrite-Host "🔐 SSL Certificate Generator for Developer Portfolio" -ForegroundColor Cyan

Write-Host "==================================================" -ForegroundColor CyanWrite-Host "==================================================" -ForegroundColor Cyan

Write-Host ""Write-Host ""



# Create ssl directory if it doesn't exist# Create ssl directory if it doesn't exist

if (!(Test-Path "ssl")) {if (!(Test-Path "ssl")) {

    Write-Host "Creating ssl directory..." -ForegroundColor Yellow    Write-Host "📁 Creating ssl directory..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Name "ssl" | Out-Null    New-Item -ItemType Directory -Name "ssl" | Out-Null

}}



Set-Location sslSet-Location ssl



Write-Host "Generating SSL certificates..." -ForegroundColor YellowWrite-Host "🔑 Generating SSL certificates..." -ForegroundColor Yellow

Write-Host ""Write-Host ""



# Check if OpenSSL is available# Check if OpenSSL is available

try {try {

    $null = Get-Command openssl -ErrorAction Stop    $null = Get-Command openssl -ErrorAction Stop

        

    # Generate private key and certificate in one command    # Generate private key and certificate in one command

    # Valid for 365 days, 4096-bit RSA key    # Valid for 365 days, 4096-bit RSA key

    $opensslArgs = @(    $opensslArgs = @(

        "req", "-x509", "-newkey", "rsa:4096",         "req", "-x509", "-newkey", "rsa:4096", 

        "-keyout", "server.key",         "-keyout", "server.key", 

        "-out", "server.cert",         "-out", "server.cert", 

        "-days", "365",         "-days", "365", 

        "-nodes",        "-nodes",

        "-subj", "/C=US/ST=YourState/L=YourCity/O=Developer Portfolio/OU=Development/CN=localhost/emailAddress=dev@example.com"        "-subj", "/C=US/ST=YourState/L=YourCity/O=Developer Portfolio/OU=Development/CN=localhost/emailAddress=dev@example.com"

    )    )

        

    & openssl $opensslArgs    & openssl $opensslArgs

        

    if ($LASTEXITCODE -eq 0) {    if ($LASTEXITCODE -eq 0) {

        Write-Host ""        Write-Host ""

        Write-Host "SSL certificates generated successfully!" -ForegroundColor Green        Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green

        Write-Host ""        Write-Host ""

        Write-Host "Files created:" -ForegroundColor Cyan        Write-Host "📋 Files created:" -ForegroundColor Cyan

        Write-Host "   - ssl/server.key (Private key - keep secure!)" -ForegroundColor White        Write-Host "   - ssl/server.key (Private key - keep secure!)" -ForegroundColor White

        Write-Host "   - ssl/server.cert (SSL certificate)" -ForegroundColor White        Write-Host "   - ssl/server.cert (SSL certificate)" -ForegroundColor White

        Write-Host ""        Write-Host ""

        Write-Host "Setting secure permissions on private key..." -ForegroundColor Yellow        Write-Host "🔒 Setting secure permissions on private key..." -ForegroundColor Yellow

                

        # Set secure permissions (Windows equivalent of chmod 600)        # Set secure permissions (Windows equivalent of chmod 600)

        $acl = Get-Acl "server.key"        $acl = Get-Acl "server.key"

        $acl.SetAccessRuleProtection($true, $false)  # Disable inheritance        $acl.SetAccessRuleProtection($true, $false)  # Disable inheritance

        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(

            [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,            [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,

            "FullControl",            "FullControl",

            "Allow"            "Allow"

        )        )

        $acl.SetAccessRule($accessRule)        $acl.SetAccessRule($accessRule)

        Set-Acl "server.key" $acl        Set-Acl "server.key" $acl

                

        Write-Host ""        Write-Host ""

        Write-Host "Setup complete! You can now run: npm start" -ForegroundColor Green        Write-Host "✨ Setup complete! You can now run: npm start" -ForegroundColor Green

        Write-Host ""        Write-Host ""

        Write-Host "IMPORTANT:" -ForegroundColor Red        Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red

        Write-Host "   - NEVER commit server.key to version control" -ForegroundColor Yellow        Write-Host "   - NEVER commit server.key to version control" -ForegroundColor Yellow

        Write-Host "   - This certificate is for development only" -ForegroundColor Yellow        Write-Host "   - This certificate is for development only" -ForegroundColor Yellow

        Write-Host "   - Your browser will show a security warning (this is expected)" -ForegroundColor Yellow        Write-Host "   - Your browser will show a security warning (this is expected)" -ForegroundColor Yellow

        Write-Host ""        Write-Host ""

                

        # Display certificate info        # Display certificate info

        Write-Host "Certificate Information:" -ForegroundColor Cyan        Write-Host "📄 Certificate Information:" -ForegroundColor Cyan

        & openssl x509 -in server.cert -noout -subject -dates        & openssl x509 -in server.cert -noout -subject -dates

        Write-Host ""        Write-Host ""

    } else {    } else {

        Write-Host ""        Write-Host ""

        Write-Host "Error generating certificates" -ForegroundColor Red        Write-Host "❌ Error generating certificates" -ForegroundColor Red

        Write-Host "   Please ensure OpenSSL is installed and try again" -ForegroundColor Yellow        Write-Host "   Please ensure OpenSSL is installed and try again" -ForegroundColor Yellow

        exit 1        exit 1

    }    }

} catch {} catch {

    Write-Host ""    Write-Host ""

    Write-Host "OpenSSL not found!" -ForegroundColor Red    Write-Host "❌ OpenSSL not found!" -ForegroundColor Red

    Write-Host ""    Write-Host ""

    Write-Host "Please install OpenSSL first. You have several options:" -ForegroundColor Yellow    Write-Host "Please install OpenSSL first. You have several options:" -ForegroundColor Yellow

    Write-Host "1. Install via Chocolatey: choco install openssl" -ForegroundColor Cyan    Write-Host "1. Install via Chocolatey: choco install openssl" -ForegroundColor Cyan

    Write-Host "2. Install via Scoop: scoop install openssl" -ForegroundColor Cyan    Write-Host "2. Install via Scoop: scoop install openssl" -ForegroundColor Cyan

    Write-Host "3. Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Cyan    Write-Host "3. Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Cyan

    Write-Host "4. Use Git for Windows (includes OpenSSL)" -ForegroundColor Cyan    Write-Host "4. Use Git for Windows (includes OpenSSL)" -ForegroundColor Cyan

    Write-Host ""    Write-Host ""

    exit 1    exit 1

}}



Set-Location ..Set-Location ..