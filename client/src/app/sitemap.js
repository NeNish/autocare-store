import { serverApi } from '@/lib/api';
import { siteUrl } from '@/lib/business';
import { POLICIES } from '@/lib/policies';

export default async function sitemap() {
  const pages = ['', '/products', '/simulator', '/fit', '/compare', '/contact', ...Object.keys(POLICIES).map((k) => `/policies/${k}`)];
  const { products } = await serverApi('/products?limit=100').catch(() => ({ products: [] }));
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.6 })),
    ...products.map((p) => ({ url: `${siteUrl}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly', priority: 0.8 })),
  ];
}
