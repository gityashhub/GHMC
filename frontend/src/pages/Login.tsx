import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 space-y-6">
          {/* Logo/Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Chemical Waste Management</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@chemwaste.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Default Credentials Hint */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              Default credentials:
              <br />
              <span className="font-mono">admin@chemwaste.com / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

