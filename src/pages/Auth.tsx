import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="w-full max-w-md mx-auto">
        {isLogin ? <LoginForm /> : <SignUpForm />}
        
        <div className="text-center mt-4 text-sm text-muted-foreground">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setIsLogin(false)} className="underline text-foreground">Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)} className="underline text-foreground">Sign in</button>
            </>
          )}
          <div className="mt-2">
            <Link to={redirect} className="hover:underline">Back</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 