import { apiFetch } from '@/lib/api';

export async function loginUser(email: string, password: string) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: email, password }),
  });
}

export async function getCurrentUser() {
  return apiFetch('/auth/me', { method: 'GET' });
}
