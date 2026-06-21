import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-brand-900 text-white">
      <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Column 1: Logo + tagline */}
          <div>
            <Link href="/" className="font-display text-lg font-semibold text-white hover:text-accent-400 transition-colors">
              Thrive Vineyard
            </Link>
            <p className="mt-2 text-sm text-white/70">Spirit Filled. Down to Earth.</p>
          </div>

          {/* Column 2: Service times */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-400">Sunday Services</h3>
            <ul className="mt-3 space-y-1 text-sm text-white/80">
              <li>8:30 AM — Express(o) <span className="text-white/50">(paused for renovations)</span></li>
              <li>9:30 AM — Family Worship</li>
              <li className="mt-2 text-white/50 text-xs">845 E Glencoe St, Palatine, IL 60074</li>
            </ul>
          </div>

          {/* Column 3: Contact + social */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-400">Connect</h3>
            <ul className="mt-3 space-y-1 text-sm text-white/80">
              <li>
                <a href="tel:+18476685622" className="hover:text-white transition-colors">
                  (847) 668-5622
                </a>
              </li>
              <li>
                <a href="mailto:info@thrivevineyard.com" className="hover:text-white transition-colors">
                  info@thrivevineyard.com
                </a>
              </li>
            </ul>
            <div className="mt-4 flex gap-4">
              <a
                href="https://www.youtube.com/@thrivevineyardchurchus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                YouTube
              </a>
              <a
                href="https://www.facebook.com/thrivevineyardchurch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/thrivevineyard/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>

        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Thrive Vineyard. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
