"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ShieldAlert } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an external service in production
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] h-full w-full">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <ShieldAlert className="text-danger w-12 h-12" />
        <h2 className="text-2xl font-serif">Something went wrong</h2>
        <p className="text-muted text-sm">
          We encountered an error loading this module. Please try again.
        </p>
        <Button onClick={() => reset()} variant="outline" className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
