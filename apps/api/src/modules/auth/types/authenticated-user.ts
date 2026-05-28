export type AuthenticatedUser = {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
};

