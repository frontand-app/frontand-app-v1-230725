import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/AuthProvider';

export const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
            onChange={(e) => setEmail(e.target.value)}
              />
            </div>
        <div>
          <Label htmlFor="password">Password</Label>
              <Input
                id="password"
            type="password" 
                value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Button className="w-full" onClick={async () => {
          try {
            setError(null);
            await signUp(email, password);
          } catch (e: any) {
            setError(e.message || 'Sign-up failed');
          }
        }}>Sign Up</Button>
      </CardContent>
    </Card>
  );
}; 