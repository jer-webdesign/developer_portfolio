# Authentication System Test Script

# This script tests the authentication endpoints using PowerShell

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

# Server base URL - try HTTP first for testing, fallback to HTTPS
$baseUrl = "http://localhost:3000"
$httpsUrl = "https://localhost:3000"

# Test server connectivity
Write-Host "Testing server connectivity..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 5 | Out-Null
    Write-Host "✅ Connected to HTTP server at $baseUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTP server not responding, trying HTTPS..." -ForegroundColor Yellow
    $baseUrl = $httpsUrl
    try {
        Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 5 | Out-Null
        Write-Host "✅ Connected to HTTPS server at $baseUrl" -ForegroundColor Green
    } catch {
        Write-Host "❌ Neither HTTP nor HTTPS server responding. Make sure the backend server is running." -ForegroundColor Red
        Write-Host "Run: npm start or npm run dev in the backend directory" -ForegroundColor Yellow
        exit 1
    }
}

# Test data
$testUser = @{
    username = "testuser"
    email = "test@example.com"
    password = "TestPassword123!"
}

$adminUser = @{
    username = "admin"
    email = "admin@example.com"
    password = "AdminPassword123!"
}

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
        # Set security protocol to TLS 1.2
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

# Test 1: User Registration
Write-Host "Testing User Registration..." -ForegroundColor Yellow
$registerResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/register" -Body $testUser
if ($registerResult -and $registerResult.success) {
    Write-Host "✅ User registration successful" -ForegroundColor Green
} else {
    Write-Host "❌ User registration failed" -ForegroundColor Red
}

# Test 2: User Login
Write-Host "`nTesting User Login..." -ForegroundColor Yellow
$loginResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body @{
    email = $testUser.email
    password = $testUser.password
}
if ($loginResult -and $loginResult.success) {
    Write-Host "✅ User login successful" -ForegroundColor Green
    $userToken = $loginResult.accessToken
} else {
    Write-Host "❌ User login failed" -ForegroundColor Red
    return
}

# Test 3: Access Protected Route (Profile)
Write-Host "`nTesting Protected Route (Profile)..." -ForegroundColor Yellow
$profileResult = Invoke-ApiRequest -Method GET -Endpoint "/api/profile" -Token $userToken
if ($profileResult -and $profileResult.success) {
    Write-Host "✅ Profile access successful" -ForegroundColor Green
} else {
    Write-Host "❌ Profile access failed" -ForegroundColor Red
}

# Test 4: Access Admin Route (Should Fail)
Write-Host "`nTesting Admin Route Access (Should Fail)..." -ForegroundColor Yellow
$adminResult = Invoke-ApiRequest -Method GET -Endpoint "/api/admin/users" -Token $userToken
if ($adminResult -and $adminResult.success) {
    Write-Host "❌ Admin access succeeded (should have failed)" -ForegroundColor Red
} else {
    Write-Host "✅ Admin access properly denied" -ForegroundColor Green
}

# Test 5: Register Admin User
Write-Host "`nRegistering Admin User..." -ForegroundColor Yellow
$adminRegisterResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/register" -Body $adminUser
if ($adminRegisterResult -and $adminRegisterResult.success) {
    Write-Host "✅ Admin user registration successful" -ForegroundColor Green
    
    # Note: In a real system, you'd promote the user to admin through database or admin interface
    Write-Host "Note: You'll need to manually promote this user to admin role in the database" -ForegroundColor Cyan
} else {
    Write-Host "❌ Admin user registration failed" -ForegroundColor Red
}

# Test 6: Token Refresh
Write-Host "`nTesting Token Refresh..." -ForegroundColor Yellow
$refreshResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/refresh"
if ($refreshResult -and $refreshResult.success) {
    Write-Host "✅ Token refresh successful" -ForegroundColor Green
} else {
    Write-Host "❌ Token refresh failed (expected if no refresh cookie)" -ForegroundColor Yellow
}

# Test 7: Logout
Write-Host "`nTesting Logout..." -ForegroundColor Yellow
$logoutResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/logout" -Token $userToken
if ($logoutResult -and $logoutResult.success) {
    Write-Host "✅ Logout successful" -ForegroundColor Green
} else {
    Write-Host "❌ Logout failed" -ForegroundColor Red
}

# Test 8: Access After Logout (Should Fail)
Write-Host "`nTesting Access After Logout (Should Fail)..." -ForegroundColor Yellow
$afterLogoutResult = Invoke-ApiRequest -Method GET -Endpoint "/api/profile" -Token $userToken
if ($afterLogoutResult -and $afterLogoutResult.success) {
    Write-Host "❌ Profile access succeeded after logout (should have failed)" -ForegroundColor Red
} else {
    Write-Host "✅ Profile access properly denied after logout" -ForegroundColor Green
}

Write-Host "`n🎉 Authentication system tests completed!" -ForegroundColor Cyan