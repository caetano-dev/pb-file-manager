import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

export function useRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const register = async (email: string, password: string) => {
    setIsSubmitting(true);
    setError('');

    try {
      await registerUser(email, password);
      const loginResponse = await loginUser(email, password);
      await login(loginResponse.access_token);
      navigate('/');
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