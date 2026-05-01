export interface User {
  email: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthProviderProps {
  children: ReactNode;
}