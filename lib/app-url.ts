const PRODUCTION_APP_URL = "https://www.karibuvms.com";

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function withHttps(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return normalizeUrl(appUrl);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return normalizeUrl(siteUrl);

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) return normalizeUrl(withHttps(vercelUrl));

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return PRODUCTION_APP_URL;
}
