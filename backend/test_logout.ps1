# Targeted Logout Test Script

# Bypass SSL certificate validation for self-signed certificates
if (-not ([System.Management.Automation.PSTypeName]'ServerCertificateValidationCallback').Type) {
    $certCallback = @"
        using System;
        using System.Net;
        using System.Net.Security;
        using System.Security.Cryptography.X509Certificates;
        public class ServerCertificateValidationCallback
        {
            public static void Ignore()
            {
                if(ServicePointManager.ServerCertificateValidationCallback ==null)
                {
                    ServicePointManager.ServerCertificateValidationCallback += 
                        delegate
                        (
                            Object obj, 
                            X509Certificate certificate, 
                            X509Chain chain, 
                            SslPolicyErrors errors
                        )
                        {
                            return true;
                        };
                }
            }
        }
"@
    Add-Type $certCallback
}
[ServerCertificateValidationCallback]::Ignore()

$baseUrl = "https://localhost:3000"

# Function to make API requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [string]$Token = $null
    )
    
    $uri = "$baseUrl$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json
            return Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody
        } else {
            return Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
        return $null
    }
}

# Generate unique test user
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$testUser = @{
    username = "logouttest$timestamp"
    email = "logouttest$timestamp@example.com"
    password = "Test@1234"
}

Write-Host "=== TARGETED LOGOUT TEST ===" -ForegroundColor Cyan

# Step 1: Register a new user
Write-Host "`n1. Registering new test user..." -ForegroundColor Yellow
$registerResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/register" -Body $testUser
if ($registerResult -and $registerResult.success) {
    Write-Host "✅ User registration successful" -ForegroundColor Green
} else {
    Write-Host "❌ User registration failed" -ForegroundColor Red
    exit 1
}

# Step 2: Login to get token
Write-Host "`n2. Logging in to get access token..." -ForegroundColor Yellow
$loginResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body @{
    email = $testUser.email
    password = $testUser.password
}
if ($loginResult -and $loginResult.success) {
    Write-Host "✅ Login successful" -ForegroundColor Green
    $accessToken = $loginResult.accessToken
    Write-Host "Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "❌ Login failed" -ForegroundColor Red
    exit 1
}

# Step 3: Access protected route (should work)
Write-Host "`n3. Testing protected route access (should work)..." -ForegroundColor Yellow
$profileResult = Invoke-ApiRequest -Method GET -Endpoint "/api/profile" -Token $accessToken
if ($profileResult -and $profileResult.success) {
    Write-Host "✅ Profile access successful" -ForegroundColor Green
} else {
    Write-Host "❌ Profile access failed" -ForegroundColor Red
}

# Step 4: Logout
Write-Host "`n4. Logging out..." -ForegroundColor Yellow
$logoutResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/logout" -Token $accessToken
if ($logoutResult -and $logoutResult.success) {
    Write-Host "✅ Logout successful" -ForegroundColor Green
} else {
    Write-Host "❌ Logout failed" -ForegroundColor Red
}

# Step 5: Try to access protected route again (should fail)
Write-Host "`n5. Testing protected route access after logout (should fail)..." -ForegroundColor Yellow
$afterLogoutResult = Invoke-ApiRequest -Method GET -Endpoint "/api/profile" -Token $accessToken
if ($afterLogoutResult -and $afterLogoutResult.success) {
    Write-Host "❌ SECURITY ISSUE: Profile access succeeded after logout!" -ForegroundColor Red
    Write-Host "The token should have been invalidated." -ForegroundColor Red
} else {
    Write-Host "✅ Profile access properly denied after logout" -ForegroundColor Green
}

Write-Host "`n=== TEST COMPLETED ===" -ForegroundColor Cyan