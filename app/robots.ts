import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://lifecode.app";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/zh/account", "/en/account", "/ko/account"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
