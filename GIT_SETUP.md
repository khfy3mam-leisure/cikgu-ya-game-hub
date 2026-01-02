# Git Setup and Authentication

This project uses a GitHub Personal Access Token for authentication when pushing to the repository.

## Setup

### 1. Environment Variables

The GitHub access token is stored in `.env.local` file:

```env
GIT_TOKEN=your_github_personal_access_token_here
```

**Important:** The `.env.local` file is already in `.gitignore` and will not be committed to the repository.

### 2. Using the Token

#### Option A: Using Git Credential Helper (Recommended)

You can configure git to use the token from environment variables:

**Windows (PowerShell):**
```powershell
$env:GIT_TOKEN = (Get-Content .env.local | Select-String "GIT_TOKEN").ToString().Split("=")[1]
git remote set-url origin https://$env:GIT_TOKEN@github.com/khfy3mam-leisure/cikgu-ya-game-hub.git
```

**Or manually set for each push:**
```powershell
$token = (Get-Content .env.local | Select-String "GIT_TOKEN").ToString().Split("=")[1]
git push https://$token@github.com/khfy3mam-leisure/cikgu-ya-game-hub.git main
```

#### Option B: Using Git Credential Manager

1. Install [Git Credential Manager](https://github.com/GitCredentialManager/git-credential-manager)
2. When you push, it will prompt for credentials
3. Use your GitHub username and the personal access token as the password

#### Option C: Using GitHub CLI

```bash
gh auth login
# Follow the prompts to authenticate
git push origin main
```

### 3. Creating a Personal Access Token

If you need to create a new token:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "Cikgu Ya Game Hub")
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again)
7. Update `.env.local` with the new token

### 4. Security Best Practices

- ✅ **DO**: Keep `.env.local` in `.gitignore` (already configured)
- ✅ **DO**: Rotate tokens periodically
- ✅ **DO**: Use tokens with minimal required permissions
- ❌ **DON'T**: Commit tokens to git
- ❌ **DON'T**: Share tokens publicly
- ❌ **DON'T**: Hardcode tokens in scripts that get committed

### 5. Current Repository Configuration

- **Repository URL**: `https://github.com/khfy3mam-leisure/cikgu-ya-game-hub.git`
- **Default Branch**: `main`
- **Git Email**: `data.himproduct01@gmail.com`
- **Git Username**: `khfy3mam`

### 6. Common Git Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Check remote URL
git remote -v
```

### 7. Troubleshooting

**Issue: "Repository not found"**
- Check that the token has `repo` permissions
- Verify the repository URL is correct
- Ensure the token hasn't expired

**Issue: "Permission denied"**
- Verify the token in `.env.local` is correct
- Check that you have write access to the repository
- Try regenerating the token

**Issue: "Authentication failed"**
- The token might have expired
- Create a new token and update `.env.local`
- Clear git credential cache: `git credential-cache exit`

### 8. Script Helper (Optional)

You can create a PowerShell script to automate pushing:

**`push.ps1`:**
```powershell
# Read token from .env.local
$envContent = Get-Content .env.local
$tokenLine = $envContent | Where-Object { $_ -match "GIT_TOKEN" }
$token = $tokenLine.Split("=")[1].Trim()

# Push using token
git push https://$token@github.com/khfy3mam-leisure/cikgu-ya-game-hub.git main
```

Then run: `.\push.ps1`

---

**Note**: If the token is compromised or you need to rotate it, immediately revoke it in GitHub Settings and create a new one.

