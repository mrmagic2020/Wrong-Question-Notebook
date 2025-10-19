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

    result.push({
      loc: '/',
      lastmod: new Date().toISOString(),
    });

    result.push({
      loc: '/subjects',
      lastmod: new Date().toISOString(),
    });

    result.push({
      loc: '/problem-sets',
      lastmod: new Date().toISOString(),
    });

    result.push({
      loc: '/tags',
      lastmod: new Date().toISOString(),
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
