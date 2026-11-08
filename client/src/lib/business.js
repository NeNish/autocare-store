// Business details shown on policy, contact and footer pages, and used for SEO.
// Set these in the website project's environment variables (Vercel → client → Settings).
// Anything left empty is shown as "to be added" on the policy pages rather than guessed.
export const business = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'AutoCare',
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || '',
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '',
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '',
  gstin: process.env.NEXT_PUBLIC_GSTIN || '',
  hours: process.env.NEXT_PUBLIC_SUPPORT_HOURS || '',
  dispatchDays: process.env.NEXT_PUBLIC_DISPATCH_DAYS || '',
  deliveryDays: process.env.NEXT_PUBLIC_DELIVERY_DAYS || '',
  returnDays: process.env.NEXT_PUBLIC_RETURN_DAYS || '',
  jurisdiction: process.env.NEXT_PUBLIC_JURISDICTION || '',
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const missingBusinessFields = () =>
  ['legalName', 'email', 'phone', 'address', 'dispatchDays', 'deliveryDays', 'returnDays', 'jurisdiction'].filter((k) => !business[k]);
