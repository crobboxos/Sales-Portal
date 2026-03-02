export interface AuthenticatedUser {
  email: string;
  sfUserId?: string;
  roles: string[];
}