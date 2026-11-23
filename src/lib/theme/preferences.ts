export const THEME_STORAGE_KEY = 'thrive-theme'

/**
 * Runs inline in <head> before first paint, so a stored or system dark preference
 * never flashes light.
 */
export const themeBootScript = `(function(){try{var d=document.documentElement,s;try{s=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}var dark=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;d.classList.toggle('dark',dark)}catch(e){}})()`
