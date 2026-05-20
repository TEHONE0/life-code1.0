export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'zh' }, { lang: 'ko' }, { lang: 'ja' }, { lang: 'th' }, { lang: 'id' }]
}

export default function LangLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
