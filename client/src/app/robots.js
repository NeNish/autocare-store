import { siteUrl } from '@/lib/business';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/cart', '/login', '/register'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
