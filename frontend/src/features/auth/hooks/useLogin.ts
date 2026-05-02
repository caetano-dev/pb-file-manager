import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

export function useLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const executeLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await loginUser(email, password);
      
      await login(response.access_token);
      
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to login. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { executeLogin, isSubmitting, error, setError };
}