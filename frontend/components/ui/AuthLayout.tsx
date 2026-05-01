import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  title: string;
  error?: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
}

export const AuthLayout = ({ 
  title, 
  error, 
  children, 
  footerText, 
  footerLinkText, 
  footerHref 
}: AuthLayoutProps) => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {children}
      
      <p className="mt-4 text-center text-sm">
        {footerText}{' '}
        <Link href={footerHref} className="text-blue-600 hover:underline">
          {footerLinkText}
        </Link>
      </p>
    </div>
  </div>
);