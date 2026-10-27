import { useEffect, useState } from 'react'

export function navigate(to: string, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', to)
  } else {
    window.history.pushState({}, '', to)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const onChange = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onChange)
    return () => window.removeEventListener('popstate', onChange)
  }, [])

  return pathname
}

export function useSearchParam(name: string) {
  const [value, setValue] = useState(() => new URLSearchParams(window.location.search).get(name) ?? '')

  useEffect(() => {
    const onChange = () => setValue(new URLSearchParams(window.location.search).get(name) ?? '')
    window.addEventListener('popstate', onChange)
    return () => window.removeEventListener('popstate', onChange)
  }, [name])

  return value
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    navigate(to, true)
  }, [to])

  return null
}
