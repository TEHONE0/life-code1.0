import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_LANGS = ['en', 'zh', 'ko', 'ja', 'th', 'id']
const DEFAULT_LANG = 'en'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const firstSegment = pathname.split('/')[1]
  if (SUPPORTED_LANGS.includes(firstSegment)) {
    return NextResponse.next()
  }

  const acceptLang = req.headers.get('accept-language') ?? ''
  const al = acceptLang.toLowerCase()
  let lang = DEFAULT_LANG
  if (al.includes('zh')) lang = 'zh'
  else if (al.includes('ko')) lang = 'ko'
  else if (al.includes('ja')) lang = 'ja'
  else if (al.includes('th')) lang = 'th'
  else if (al.includes('id')) lang = 'id'

  const url = req.nextUrl.clone()
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
