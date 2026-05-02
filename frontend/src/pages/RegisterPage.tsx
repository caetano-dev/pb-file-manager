import { FormEvent, useState } from 'react';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { InputField } from '@/components/ui/InputField';
import { AuthLayout } from '@/components/ui/AuthLayout';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { register, isSubmitting, error, setError } = useRegister();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await register(email, password, confirmPassword);
  };

  return (
    <AuthLayout 
      title="Register" 
      error={error} 
      footerText="Already have an account?" 
      footerLinkText="Login here" 
      footerHref="/login"
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
          autoComplete="new-password" 
        />
        <InputField 
          label="Confirm password" 
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          required 
          autoComplete="new-password" 
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Registering...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}
