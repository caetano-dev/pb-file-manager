import { apiFetch } from '@/lib/api';
import type { LoginResponse } from '../types';

export async function loginUser(email: string, password: string) : Promise<LoginResponse> {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  }) as Promise<LoginResponse>;
}

export async function getCurrentUser() : Promise<User> {
  return apiFetch('/auth/me', { method: 'GET' }) as Promise<User>;
}

export async function registerUser(email: string, password: string) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
  });
}