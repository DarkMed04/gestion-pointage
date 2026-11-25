import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    role?: 'ADMIN' | 'SECURITY';
    username?: string;
  }

  interface AdapterUser {
    role?: 'ADMIN' | 'SECURITY';
    username?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'ADMIN' | 'SECURITY';
      username: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'ADMIN' | 'SECURITY';
    username?: string;
  }
}