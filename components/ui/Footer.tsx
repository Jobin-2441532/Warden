import * as React from "react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-8 bg-background-alt border-t border-muted/20">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs tracking-wide text-muted font-medium">
          © {new Date().getFullYear()} WARDEN. ALL RIGHTS RESERVED.
        </p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-xs uppercase tracking-wide text-muted hover:text-foreground transition-colors font-medium">
            Privacy
          </Link>
          <Link href="/terms" className="text-xs uppercase tracking-wide text-muted hover:text-foreground transition-colors font-medium">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
