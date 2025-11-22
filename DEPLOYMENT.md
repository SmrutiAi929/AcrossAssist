# Deployment Guide

This guide covers deploying the HMS Live API Web Console to various platforms.

## 📦 Building for Production

### Create Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory with:
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Production-ready React builds

### Build Output

After building, you'll have:
```
build/
├── static/
│   ├── css/         # Minified CSS files
│   ├── js/          # Minified JavaScript bundles
│   └── media/       # Optimized images and media
├── index.html       # Entry HTML file
└── ...
```

## 🌐 Deployment Options

### Option 1: Netlify (Recommended for Quick Deploy)

#### Via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   npm run build
   netlify deploy --prod
   ```

#### Via Netlify UI

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to https://app.netlify.com/
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
   - **Environment variables:** Add `REACT_APP_GEMINI_API_KEY`
6. Click "Deploy site"

### Option 2: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add REACT_APP_GEMINI_API_KEY
   ```

#### Via Vercel UI

1. Go to https://vercel.com/
2. Import your repository
3. Vercel auto-detects Create React App
4. Add environment variable: `REACT_APP_GEMINI_API_KEY`
5. Deploy!

### Option 3: GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**
   ```json
   {
     "homepage": "https://<username>.github.io/<repo-name>",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

**⚠️ Note:** GitHub Pages doesn't support environment variables. Consider using GitHub Actions with secrets.

### Option 4: AWS S3 + CloudFront

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Create S3 bucket**
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

3. **Configure bucket for static hosting**
   ```bash
   aws s3 website s3://your-bucket-name --index-document index.html
   ```

4. **Upload build files**
   ```bash
   aws s3 sync build/ s3://your-bucket-name
   ```

5. **Set up CloudFront** for HTTPS and CDN

### Option 5: Docker

1. **Create Dockerfile**
   ```dockerfile
   # Build stage
   FROM node:16-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   ARG REACT_APP_GEMINI_API_KEY
   ENV REACT_APP_GEMINI_API_KEY=$REACT_APP_GEMINI_API_KEY
   RUN npm run build

   # Production stage
   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build Docker image**
   ```bash
   docker build --build-arg REACT_APP_GEMINI_API_KEY=your_key -t hms-console .
   ```

3. **Run container**
   ```bash
   docker run -p 80:80 hms-console
   ```

### Option 6: Traditional Web Server (Apache/Nginx)

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/hms-console/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache Configuration (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 🔐 Environment Variables in Production

### Secure Environment Variable Management

**Never commit `.env` to version control!**

#### Method 1: Platform Environment Variables
Most hosting platforms (Netlify, Vercel) provide UI for setting environment variables.

#### Method 2: CI/CD Secrets
Use GitHub Actions, GitLab CI, or similar with encrypted secrets.

#### Method 3: Environment Variable Services
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault

### Example: GitHub Actions Deployment

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          REACT_APP_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: npm run build
      
      - name: Deploy to Netlify
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        run: netlify deploy --prod --dir=build
```

## ✅ Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Environment variables configured
- [ ] API keys secured (not in code)
- [ ] `.env` in `.gitignore`
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)
- [ ] Domain/SSL configured
- [ ] CORS settings verified
- [ ] Browser compatibility tested

## 🔍 Post-Deployment Verification

1. **Test the deployed application**
   - Open in browser
   - Test audio/microphone access
   - Verify API connection
   - Test all features

2. **Check browser console**
   - No errors
   - API calls working
   - Assets loading correctly

3. **Performance check**
   - Use Google Lighthouse
   - Check loading times
   - Verify mobile responsiveness

4. **Security check**
   - HTTPS enabled
   - API key not exposed in client
   - No console warnings

## 📊 Monitoring & Maintenance

### Recommended Tools

- **Error Tracking:** Sentry, LogRocket
- **Analytics:** Google Analytics, Mixpanel
- **Performance:** New Relic, Datadog
- **Uptime:** Pingdom, UptimeRobot

### Regular Maintenance

```bash
# Update dependencies (monthly)
npm outdated
npm update

# Security audit (weekly)
npm audit
npm audit fix

# Rebuild and redeploy
npm run build
```

## 🚨 Troubleshooting Deployment

### Build fails in production

```bash
# Clear cache and rebuild
rm -rf node_modules build
npm install
npm run build
```

### Environment variables not working

- Check variable name: `REACT_APP_` prefix required
- Rebuild after changing variables
- Verify platform-specific variable setup

### 404 errors on refresh

- Configure server for SPA routing
- Add proper routing rules (see server configs above)

### Assets not loading

- Check build output paths
- Verify `homepage` in `package.json`
- Check CORS settings

---

## 🎉 Deployment Complete!

Your HMS Live API Web Console is now live and ready to use!

**Need Help?** Check the troubleshooting section or refer to your hosting platform's documentation.

