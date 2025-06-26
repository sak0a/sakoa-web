# Deployment Guide for Saka's Dodgeball Server

## Netlify Deployment Steps

### 1. Prepare Repository
- Ensure all changes are committed and pushed to your Git repository
- The project is now configured with `netlify.toml` for optimal deployment

### 2. Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign in/sign up
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub, GitLab, etc.)
4. Select your repository

### 3. Configure Build Settings
Netlify should automatically detect these settings from `netlify.toml`:
- **Build command**: `npm run generate`
- **Publish directory**: `dist`
- **Node version**: 18

### 4. Set Environment Variables
In Netlify dashboard, go to Site settings → Environment variables and add:
```
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=sakaStats
ADMIN_PASSWORD=your_secure_admin_password
```

### 5. Deploy
- Click "Deploy site"
- Netlify will build and deploy your site
- You'll get a temporary URL like `https://amazing-name-123456.netlify.app`

## Custom Domain Setup (sakoa.xyz)

### 1. Add Custom Domain in Netlify
1. In your site dashboard, go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter `sakoa.xyz`
4. Netlify will provide DNS configuration instructions

### 2. Configure DNS
You'll need to update your domain's DNS settings with your domain registrar:

**Option A: Use Netlify DNS (Recommended)**
1. Change your domain's nameservers to Netlify's:
   - `dns1.p01.nsone.net`
   - `dns2.p01.nsone.net`
   - `dns3.p01.nsone.net`
   - `dns4.p01.nsone.net`

**Option B: Use Custom DNS**
Add these records to your DNS provider:
```
Type: A
Name: @
Value: 75.2.60.5

Type: AAAA  
Name: @
Value: 2600:1f18:3e5f:e500::

Type: CNAME
Name: www
Value: sakoa.xyz
```

### 3. Enable HTTPS
- Netlify will automatically provision SSL certificates
- This may take a few minutes after DNS propagation

## Post-Deployment Checklist
- [ ] Site loads correctly at sakoa.xyz
- [ ] Favicon displays properly (default-512x512.png)
- [ ] Database connection works (check server status)
- [ ] Admin panel accessible with password
- [ ] All pages and features working
- [ ] HTTPS enabled and working

## Troubleshooting
- **Build fails**: Check build logs in Netlify dashboard
- **Database connection issues**: Verify environment variables
- **Domain not working**: Check DNS propagation (can take up to 48 hours)
- **Images not loading**: Ensure all assets are in the `public/` directory

## Favicon Configuration
The site is now configured to use your `default-512x512.png` as the favicon:
- Copied to `/public/favicon.png`
- Referenced in `nuxt.config.ts`
- Includes Apple touch icon support
