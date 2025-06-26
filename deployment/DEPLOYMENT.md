# Deployment Guide for Saka's Dodgeball Server

## Plesk Deployment Steps

### 1. Prepare Your Project
- Ensure all changes are committed and the build works locally
- The CapoPlugin error has been resolved by downgrading Nuxt to v3.16.0
- Your favicon (default-512x512.png) is properly configured

### 2. Build Your Project
Run the build command to generate the production files:
```bash
npm run build
```
This creates the `.output` directory with your built application.

### 3. Prepare Files for Upload
You have two deployment options:

**Option A: Static Site (Recommended for better performance)**
```bash
npm run generate
```
Upload the contents of `.output/public/` to your domain's public folder in Plesk.

**Option B: Node.js Application**
Upload the entire `.output/` directory and set up Node.js hosting in Plesk.

### 4. Plesk Configuration

#### For Static Site Deployment:
1. In Plesk, go to your domain (sakoa.xyz)
2. Go to "Files" → Navigate to your domain's document root
3. Upload all contents from `.output/public/` to the document root
4. Ensure `index.html` is in the root directory

#### For Node.js Application:
1. Enable Node.js for your domain in Plesk
2. Set Node.js version to 18 or higher
3. Upload the `.output/` directory
4. Set the startup file to `.output/server/index.mjs`
5. Configure environment variables (see below)

### 5. Environment Variables (Node.js only)
If using Node.js deployment, configure these environment variables in Plesk:
```
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=sakaStats
ADMIN_PASSWORD=your_secure_admin_password
```

### 6. Domain Configuration
Your sakoa.xyz domain should already be configured in Plesk. If not:
1. Add sakoa.xyz as a domain in Plesk
2. Point the DNS A record to your server's IP address
3. Enable SSL certificate (Let's Encrypt is recommended)

### 7. File Permissions
Ensure proper file permissions:
- Files: 644
- Directories: 755
- Make sure the web server can read all files

## Post-Deployment Checklist
- [ ] Site loads correctly at sakoa.xyz
- [ ] Favicon displays properly (default-512x512.png)
- [ ] Database connection works (check server status)
- [ ] Admin panel accessible with password
- [ ] All pages and features working
- [ ] HTTPS/SSL certificate working

## Troubleshooting

### Static Site Issues:
- **Site not loading**: Check if `index.html` is in the document root
- **Images not loading**: Ensure all files from `.output/public/` were uploaded
- **Favicon not showing**: Clear browser cache, favicon should be at `/favicon.png`

### Node.js Application Issues:
- **App not starting**: Check Node.js version (should be 18+)
- **Database connection fails**: Verify environment variables in Plesk
- **500 errors**: Check error logs in Plesk

### General Issues:
- **Domain not working**: Check DNS settings and SSL certificate
- **Admin panel not accessible**: Verify ADMIN_PASSWORD environment variable

## Build Error Fix
The CapoPlugin error has been permanently resolved by:
- Downgrading Nuxt to v3.16.0 (stable version)
- Adding experimental headNext configuration
- Clearing node_modules and reinstalling dependencies

## Favicon Configuration
✅ Your custom favicon is properly configured:
- Source: `assets/img/default-512x512.png`
- Copied to: `public/favicon.png`
- Referenced in `nuxt.config.ts`
- Includes Apple touch icon support
- Properly included in build output

## Recommended Deployment Method
For best performance and reliability, use **Static Site Deployment**:
1. Run `npm run generate`
2. Upload contents of `.output/public/` to sakoa.xyz document root
3. No need for Node.js configuration or environment variables
4. Faster loading times and better SEO
