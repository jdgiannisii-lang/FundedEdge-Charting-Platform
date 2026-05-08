export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'dark' | 'light' | 'system';
  timezone: string;
  defaultSymbol: string;
}
