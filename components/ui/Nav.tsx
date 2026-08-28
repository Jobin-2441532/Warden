import * as React from "react"
import Link from "next/link"
import { Button } from "./Button"
import { cn } from "@/lib/utils"

export function Nav({ className }: { className?: string }) {
  return (
    <header className={cn("sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md", className)}>
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-serif text-xl tracking-tight text-foreground font-semibold">
            WARDEN
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-xs uppercase tracking-wide font-medium text-foreground/80 hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-xs uppercase tracking-wide font-medium text-foreground/80 hover:text-foreground transition-colors">
            How it Works
          </Link>
          <Link href="#pricing" className="text-xs uppercase tracking-wide font-medium text-foreground/80 hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block text-xs uppercase tracking-wide font-medium text-foreground/80 hover:text-foreground transition-colors">
            Log In
          </Link>
          <Button variant="default" className="hidden sm:inline-flex">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  )
}
