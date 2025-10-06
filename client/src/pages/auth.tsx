import React, { useState } from 'react';
import Login from '@/components/auth/login';
import Signup from '@/components/auth/signup';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <Login onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <Signup onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;