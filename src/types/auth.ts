export type UserRole = 'user' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}
