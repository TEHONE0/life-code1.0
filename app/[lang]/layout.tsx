export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'zh' }, { lang: 'ko' }]
}

export default function LangLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
