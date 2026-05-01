import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser, loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

export function useRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const register = async (email: string, password: string) => {
    setIsSubmitting(true);
    setError('');

    try {
      await registerUser(email, password);
      const loginResponse = await loginUser(email, password);
      await login(loginResponse.access_token);
      router.push('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to register. Email might be taken.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { register, isSubmitting, error, setError };
}