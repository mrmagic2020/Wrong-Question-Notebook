# Deployment Guide for Wrong Question Notebook

This guide will help you deploy the Wrong Question Notebook application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Set up a Supabase project at [supabase.com](https://supabase.com)
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## Pre-Deployment Checklist

✅ **Security Audit**: No vulnerabilities found in dependencies  
✅ **Build Test**: Application builds successfully  
✅ **TypeScript**: All type errors resolved  
✅ **Linting**: Code follows project standards  
✅ **Configuration**: Production-ready Next.js config  

## Step 1: Set Up Supabase

1. **Create a new Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and create the project

2. **Get your project credentials**:
   - Go to Settings → API
   - Copy your Project URL and anon/public key

3. **Set up your database schema** (if not already done):
   - The application expects specific tables for subjects, problems, tags, and attempts
   - Refer to your database migration files or schema documentation

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Connect your repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure the project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web` (if your Next.js app is in the web folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)

3. **Set environment variables**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Navigate to your project**:

   ```bash
   cd web
   ```

4. **Deploy**:

   ```bash
   vercel
   ```

5. **Set environment variables**:

   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

6. **Redeploy with environment variables**:

   ```bash
   vercel --prod
   ```

## Step 3: Configure Domain (Optional)

1. **Add custom domain**:
   - Go to your project dashboard on Vercel
   - Navigate to Settings → Domains
   - Add your custom domain
   - Follow the DNS configuration instructions

2. **Update environment variables**:
   - Update `SITE_URL` in your environment variables to match your domain

## Step 4: Post-Deployment Verification

1. **Test the application**:
   - Visit your deployed URL
   - Test user registration and login
   - Create a subject and add problems
   - Verify file uploads work correctly

2. **Check logs**:
   - Monitor Vercel function logs for any errors
   - Check Supabase logs for database issues

3. **Performance check**:
   - Run Lighthouse audit
   - Check Core Web Vitals

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Your Supabase anon key | Yes |
| `SITE_URL` | Your deployed site URL (for sitemap) | No |

## Security Considerations

✅ **Headers**: Security headers are configured in `next.config.ts`  
✅ **CORS**: Properly configured for Supabase  
✅ **Authentication**: User authentication required for protected routes  
✅ **File Uploads**: Secure file handling with Supabase Storage  

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all environment variables are set
   - Ensure TypeScript compilation passes locally
   - Verify all dependencies are installed

2. **Authentication Issues**:
   - Verify Supabase URL and keys are correct
   - Check Supabase project is active
   - Ensure RLS policies are properly configured

3. **File Upload Issues**:
   - Verify Supabase Storage is enabled
   - Check storage bucket permissions
   - Ensure file size limits are appropriate

4. **Database Connection Issues**:
   - Verify database is accessible
   - Check connection pooling settings
   - Review Supabase project status

### Getting Help

- Check Vercel deployment logs
- Review Supabase project logs
- Test locally with production environment variables
- Consult Next.js and Supabase documentation

## Monitoring and Maintenance

1. **Set up monitoring**:
   - Enable Vercel Analytics
   - Set up error tracking (Sentry, etc.)
   - Monitor Supabase usage and limits

2. **Regular maintenance**:
   - Keep dependencies updated
   - Monitor security advisories
   - Review and rotate API keys periodically

## Production Optimizations

The application includes several production optimizations:

- **Image Optimization**: Next.js Image component with WebP/AVIF support
- **Bundle Optimization**: Package imports optimized for Lucide React
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **SEO**: Sitemap generation and robots.txt
- **Performance**: Static generation where possible

## Support

For issues specific to this application, check the project's GitHub repository or contact the development team.
