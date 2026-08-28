import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm bg-background-alt shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Warden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Email</label>
              <input type="email" name="email" required className="w-full p-2 rounded bg-background border border-muted/20" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Password</label>
              <input type="password" name="password" required className="w-full p-2 rounded bg-background border border-muted/20" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button formAction={login} className="w-full">Sign In</Button>
              <Button formAction={signup} variant="outline" className="w-full">Sign Up</Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center justify-center pt-0">
          <p className="text-xs text-muted">
            Manage your AI-ready storefront.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
