/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://wqn.magicworks.app/',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin/*',
    '/api/*',
    '/auth/confirm',
    '/auth/error',
    '/auth/sign-up-success',
    '/auth/update-password',
  ],
  additionalPaths: async () => {
    const result = [];

    // Add static pages with proper priorities and metadata
    result.push({
      loc: '/',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 1.0,
    });

    result.push({
      loc: '/subjects',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.9,
    });

    result.push({
      loc: '/problems',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.9,
    });

    result.push({
      loc: '/tags',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
    });

    // Add auth pages for discoverability
    result.push({
      loc: '/auth/login',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.5,
    });

    result.push({
      loc: '/auth/sign-up',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.5,
    });

    result.push({
      loc: '/auth/forgot-password',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.3,
    });

    return result;
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
  },
};
