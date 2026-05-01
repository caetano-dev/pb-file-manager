const BASE_URL = '/api';

interface FetchOptions extends RequestInit {
  responseType?: 'json' | 'blob';
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = {};
    try { errorData = await response.json(); } catch (e) {}
    throw { response: { data: errorData }, status: response.status };
  }

  if (response.status === 204) return null;

  if (options.responseType === 'blob') {
    return response.blob();
  }

  return response.json();
}