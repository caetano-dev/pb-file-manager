import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return children;
};
