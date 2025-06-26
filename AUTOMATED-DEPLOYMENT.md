# Automated Deployment Setup for Plesk

This guide shows you how to set up automatic deployment from GitHub to your Plesk server for sakoa.xyz.

## Option 1: GitHub Actions (Recommended)

You have two workflow options:
- **`deploy.yml`** - Uses Node.js 20, triggers automatically on push (recommended)
- **`deploy-bun.yml`** - Uses Bun runtime, manual trigger only (faster, experimental)

### Step 1: Set up GitHub Repository Secrets
In your GitHub repository, go to **Settings → Secrets and variables → Actions → Repository secrets**, and add these secrets:

```
PLESK_HOST=your-server-ip-or-domain
PLESK_USERNAME=your-ssh-username
PLESK_PASSWORD=your-ssh-password
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=sakaStats
ADMIN_PASSWORD=your-admin-password
```

**Alternative: Use SSH Key (More Secure)**
Instead of password, you can use SSH key:
```
PLESK_SSH_KEY=your-private-ssh-key-content
```

### Step 2: Configure Plesk for Node.js Deployment
1. Enable SSH access for your domain in Plesk (use `/bin/bash` shell)
2. Enable Node.js for your domain in Plesk control panel
3. Set Node.js version to **20 or higher** (or enable Bun if available)
4. Set startup file to `httpdocs/.output/server/index.mjs`
5. Set working directory to `/var/www/vhosts/sakoa.xyz/httpdocs/.output/server`
6. Make sure your user has write permissions to `/var/www/vhosts/sakoa.xyz/httpdocs/`

### Step 3: Test Deployment

**For Node.js 20 (Automatic):**
1. Push any change to your main/master branch
2. Check the "Actions" tab in GitHub to see the deployment progress
3. Your site should update automatically at https://sakoa.xyz

**For Bun (Manual):**
1. Go to your GitHub repository → Actions tab
2. Select "Deploy to Plesk (Bun)" workflow
3. Click "Run workflow" button
4. Choose your branch and click "Run workflow"

## Option 2: Plesk Git Integration

### Step 1: Enable Git in Plesk
1. Go to your domain in Plesk
2. Navigate to "Git" section
3. Add your GitHub repository
4. Set deployment path to `httpdocs`

### Step 2: Configure Build Commands
In Plesk Git settings, add these commands:
```bash
npm ci
npm run generate
cp -r .output/public/* ./
```

### Step 3: Set up Auto-deployment
1. Enable "Auto-deploy" in Plesk Git settings
2. Set branch to `master` or `main`
3. Test by pushing to your repository

## Option 3: Webhook Deployment

### Step 1: Upload Webhook Script
1. Upload `webhook-deploy.php` to a web-accessible directory (e.g., `/webhook/`)
2. Make sure PHP has permission to execute shell commands
3. Create necessary directories:
   ```bash
   mkdir -p /var/www/vhosts/sakoa.xyz/repository
   mkdir -p /var/www/vhosts/sakoa.xyz/logs
   ```

### Step 2: Configure GitHub Webhook
1. Go to your GitHub repository → Settings → Webhooks
2. Add webhook with:
   - **URL**: `https://sakoa.xyz/webhook/webhook-deploy.php`
   - **Content type**: `application/json`
   - **Secret**: Set a secure secret and update it in the PHP file
   - **Events**: Just the push event

### Step 3: Initial Repository Setup
```bash
cd /var/www/vhosts/sakoa.xyz/repository
git clone https://github.com/sak0a/sakoa-web.git .
```

## Option 4: Manual Deployment Script

### Step 1: Upload Script
Upload `deploy-plesk.sh` to your server and make it executable:
```bash
chmod +x deploy-plesk.sh
```

### Step 2: Run Manually or Schedule
You can either:
- Run manually: `./deploy-plesk.sh`
- Schedule with cron: `0 */6 * * * /path/to/deploy-plesk.sh`

## Troubleshooting

### Common Issues:

**Permission Denied:**
```bash
chmod +x deploy-plesk.sh
chown -R your-user:your-group /var/www/vhosts/sakoa.xyz/
```

**Node.js Not Found:**
Make sure Node.js 18+ is installed and in PATH:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Git Not Found:**
```bash
sudo apt-get install git
```

**Build Fails:**
Check that all environment variables are set correctly and the database is accessible.

### Deployment Verification:

After each deployment, verify:
- [ ] Site loads at https://sakoa.xyz
- [ ] Favicon displays correctly
- [ ] JSON files are accessible (donors.json, servers.json)
- [ ] Admin panel works
- [ ] All pages load without errors

## Recommended Setup

For most users, I recommend **Option 1 (GitHub Actions)** because:
- ✅ Most reliable and secure
- ✅ Great logging and error reporting
- ✅ Easy to configure and maintain
- ✅ Works with any hosting provider
- ✅ Can run tests before deployment
- ✅ Automatic rollback on failure

## Security Notes

- Always use SSH keys instead of passwords when possible
- Keep your webhook secrets secure
- Regularly update your deployment scripts
- Monitor deployment logs for suspicious activity
- Use HTTPS for all webhook URLs

## File Structure After Setup

```
/var/www/vhosts/sakoa.xyz/httpdocs/
├── .output/            # Built Nuxt application
│   ├── server/         # Node.js server files
│   │   ├── index.mjs   # Main server file (startup file)
│   │   └── .env        # Environment variables
│   └── public/         # Static assets
│       ├── index.html
│       ├── favicon.png
│       ├── donors.json
│       └── servers.json
├── server/             # Your server data and API files
│   └── data/
│       ├── donors.json
│       └── servers.json
├── backup/             # Automatic backups
└── repository/         # Git repository (for webhook/script deployment)
```

**Note**: Everything is deployed to the `httpdocs` directory. The startup file should be set to `httpdocs/.output/server/index.mjs` in Plesk.

Your TF2 Dodgeball Server will now automatically deploy every time you push changes to GitHub!
