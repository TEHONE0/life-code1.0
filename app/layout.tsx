import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "生命代码 · LIFE CODE",
  description: "如果宇宙是写好的代码，你想不想知道你的生命代码是什么？解锁你的心理Bug与生命主权重。",
  keywords: ["生命代码", "心理分析", "九型人格", "life code", "personality report", "psychological analysis"],
  authors: [{ name: "Life Code" }],
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "生命代码" },
  openGraph: {
    title: "生命代码 · LIFE CODE",
    description: "如果宇宙是写好的代码，你想不想知道你的生命代码是什么？",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Life Code" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "生命代码 · LIFE CODE",
    description: "如果宇宙是写好的代码，你想不想知道你的生命代码是什么？",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050a05",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
