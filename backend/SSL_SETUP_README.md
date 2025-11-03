# SSL Certificate Setup Documentation

## Generated Files
- `ssl/server.cert` - Self-signed SSL certificate
- `ssl/server.key` - RSA private key (4096-bit)

# SSL Certificate Setup Documentation

This guide covers SSL certificate generation for the Developer Portfolio HTTPS server.

##  **Quick Setup (Recommended)**

### **For Windows PowerShell Users:**
```powershell
# Navigate to backend directory
cd backend

# Run the automated SSL setup script
.\ssl_setup.ps1
```

The PowerShell script will:
-  Create the `ssl/` directory automatically
-  Generate 4096-bit RSA certificates
-  Set secure file permissions (Windows ACL)
-  Display certificate information
-  Provide setup completion confirmation

##  **Generated Files**
- `ssl/server.cert` - Self-signed SSL certificate
- `ssl/server.key` - RSA private key (4096-bit)

##  **Certificate Details**
- **Subject**: `C=US, ST=YourState, L=YourCity, O=Developer Portfolio, OU=Development, CN=localhost, emailAddress=dev@example.com`
- **Valid From**: October 10, 2025
- **Valid Until**: October 10, 2026 (365 days)
- **Algorithm**: SHA256 with RSA Encryption
- **Key Size**: 4096-bit RSA

##  **Manual Setup (Alternative)**

If you prefer to run OpenSSL commands manually or need to customize the certificate:

### **Prerequisites:**
- OpenSSL installed and available in PATH
- PowerShell or Command Prompt

### **Manual PowerShell Commands:**
```powershell
# Create ssl directory
New-Item -ItemType Directory -Name "ssl" -Force
Set-Location ssl

# Generate certificate and private key
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.cert -days 365 -nodes -subj "/C=US/ST=YourState/L=YourCity/O=Developer Portfolio/OU=Development/CN=localhost/emailAddress=dev@example.com"

# Set secure permissions (Windows)
icacls server.key /inheritance:r /grant:r "$env:USERNAME`:F"

# Return to parent directory
Set-Location ..
```


### **Permission Issues:**
The script automatically sets secure permissions, but if you encounter issues:
```powershell
# Manual permission fix
$acl = Get-Acl "ssl\server.key"
$acl.SetAccessRuleProtection($true, $false)
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, "FullControl", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "ssl\server.key" $acl
```

##  **Security Notes**
-  Private key permissions secured (Windows ACL applied automatically)
-  **NEVER commit server.key to version control**
-  Certificate is for development use only
-  Browsers will show security warnings (expected for self-signed certificates)
-  Add `ssl/` directory to `.gitignore` to prevent accidental commits

##  **Usage**
This certificate is ready for use with HTTPS in your Node.js application. The server is configured to use:
- **Certificate file**: `ssl/server.cert`
- **Private key file**: `ssl/server.key`

##  **Next Steps**
1.  Certificates generated automatically by script
2.  Server configuration already updated for HTTPS
3.  SSL directory added to `.gitignore`
4.  **Ready to run**: `npm start`

##  **Testing Your Setup**
After running the script and starting your server:
```powershell
# Start the HTTPS server
npm start

# Visit in browser (accept security warning)
# https://localhost:3000
```

**Expected Browser Behavior:**
- Security warning appears (click "Advanced" → "Proceed to localhost")
- This is normal for self-signed certificates
