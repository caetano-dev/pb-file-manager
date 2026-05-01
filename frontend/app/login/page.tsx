'use client';

import { useState, FormEvent } from 'react';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { InputField } from '@/components/ui/InputField';
import { AuthLayout } from '@/components/ui/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { executeLogin, isSubmitting, error } = useLogin();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  return (
    <AuthLayout 
      title="Login" 
      error={error} 
      footerText="Don't have an account?" 
      footerLinkText="Register here" 
      footerHref="/register"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField 
          label="Email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          autoComplete="username" 
        />
        <InputField 
          label="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          autoComplete="current-password" 
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </AuthLayout>
  );
}
