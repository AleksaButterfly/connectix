import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PAGES = ['/', '/about']
const AUTH_PAGES = ['/login', '/register', '/forgot-password']
const SPECIAL_AUTH_PAGES = ['/auth/callback', '/reset-password'] // Pages that need special handling

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check if it's a special auth page (callback, reset-password)
  const isSpecialAuthPage = SPECIAL_AUTH_PAGES.some((page) => pathname.startsWith(page))

  // Always allow access to special auth pages regardless of auth status
  if (isSpecialAuthPage) {
    return supabaseResponse
  }

  // Check if it's a public page (exact match or starts with)
  const isPublicPage = PUBLIC_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  )

  // Check if it's an auth page
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page))

  // Allow public pages and auth pages to be accessed without authentication
  const isAccessibleWithoutAuth = isPublicPage || isAuthPage

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login for all non-public pages
  if (!user && !isAccessibleWithoutAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
