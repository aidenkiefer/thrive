export const THEME_STORAGE_KEY = 'thrive-theme'
export const TRANSITION_STORAGE_KEY = 'thrive-page-transition'

export const PAGE_TRANSITIONS = ['lift', 'zoom', 'focus'] as const
export type PageTransitionStyle = (typeof PAGE_TRANSITIONS)[number]
export const DEFAULT_PAGE_TRANSITION: PageTransitionStyle = 'zoom'

/**
 * Runs inline in <head> before first paint, so a stored or system dark preference
 * never flashes light. Also applies the page-transition style; `?transition=lift|zoom|focus`
 * previews another style and remembers it on this device.
 */
export const themeBootScript = `(function(){try{var d=document.documentElement,s=localStorage.getItem('${THEME_STORAGE_KEY}');var dark=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;d.classList.toggle('dark',dark);var ok=${JSON.stringify(PAGE_TRANSITIONS)},q=new URLSearchParams(location.search).get('transition');if(q&&ok.indexOf(q)>-1)localStorage.setItem('${TRANSITION_STORAGE_KEY}',q);var t=localStorage.getItem('${TRANSITION_STORAGE_KEY}');d.setAttribute('data-transition',ok.indexOf(t)>-1?t:'${DEFAULT_PAGE_TRANSITION}')}catch(e){}})()`
