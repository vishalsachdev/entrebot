# Deployment Guide

## Quick Start

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Environment Variables

Create a `.env.production` file:

```env
VITE_API_URL=https://api.venturebot.com
VITE_APP_NAME=VentureBot
VITE_APP_VERSION=1.0.0
```

## Build Configuration

### Vite Configuration

The app uses Vite for building. Key configurations in `vite.config.ts`:

- **Code splitting**: Automatic chunk splitting for optimal loading
- **Asset optimization**: Images and fonts are optimized
- **Tree shaking**: Unused code is removed
- **Minification**: JavaScript and CSS are minified

### Build Output

The `npm run build` command creates a `dist` folder with:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── manifest.json
```

## Deployment Options

### Option 1: Static Hosting (Recommended)

Deploy to any static hosting service:

#### Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t venturebot-frontend .
docker run -p 80:80 venturebot-frontend
```

### Option 3: Traditional Server

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name venturebot.com;
    root /var/www/venturebot/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

## Performance Optimization

### 1. Enable Compression

Ensure gzip/brotli compression is enabled on your server.

### 2. CDN Configuration

Use a CDN for static assets:

- CloudFlare
- AWS CloudFront
- Fastly

### 3. Caching Strategy

```nginx
# Cache HTML for 5 minutes
location = /index.html {
    add_header Cache-Control "public, max-age=300";
}

# Cache assets for 1 year
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### 4. Preload Critical Resources

Already configured in `index.html`:

```html
<link rel="preload" href="/assets/main.js" as="script">
<link rel="preload" href="/assets/main.css" as="style">
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d venturebot.com -d www.venturebot.com

# Auto-renewal is set up automatically
```

### Force HTTPS

```nginx
server {
    listen 80;
    server_name venturebot.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name venturebot.com;
    
    ssl_certificate /etc/letsencrypt/live/venturebot.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/venturebot.com/privkey.pem;
    
    # ... rest of configuration
}
```

## Monitoring

### 1. Application Monitoring

Set up monitoring with:
- **Sentry** for error tracking
- **Google Analytics** for usage analytics
- **LogRocket** for session replay

### 2. Server Monitoring

Monitor:
- CPU usage
- Memory usage
- Disk space
- Network traffic
- Response times

### 3. Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

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
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      
      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://venturebot-frontend --delete
        working-directory: ./frontend
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID }} --paths "/*"
```

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 404 on Refresh

Ensure your server is configured for SPA routing (see Nginx config above).

### Slow Load Times

1. Check bundle size: `npm run build -- --analyze`
2. Enable compression on server
3. Use CDN for static assets
4. Implement code splitting

### API Connection Issues

1. Verify CORS settings on backend
2. Check API_URL environment variable
3. Ensure proxy configuration is correct

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] API keys not exposed in frontend code
- [ ] Content Security Policy configured
- [ ] Regular dependency updates
- [ ] Input validation on all forms
- [ ] XSS protection enabled

## Post-Deployment

1. **Verify deployment**: Check all pages load correctly
2. **Test critical paths**: Login, create project, chat with agent
3. **Monitor errors**: Check error tracking dashboard
4. **Performance check**: Run Lighthouse audit
5. **Mobile test**: Test on real mobile devices

## Rollback Procedure

If deployment fails:

```bash
# Revert to previous version
git revert HEAD
git push

# Or restore from backup
aws s3 sync s3://venturebot-frontend-backup/ s3://venturebot-frontend/
```

## Support

For deployment issues:
- Check build logs
- Verify environment variables
- Test locally with `npm run preview`
- Review server logs
- Check DNS configuration
