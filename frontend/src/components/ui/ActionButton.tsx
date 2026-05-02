import { ReactNode } from 'react';

interface ActionButtonProps {
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

export const ActionButton = ({ onClick, className = '', children }: ActionButtonProps) => (
  <button 
    onClick={onClick} 
    className={`p-2 rounded transition-colors inline-flex items-center ${className}`}
  >
    {children}
  </button>
);