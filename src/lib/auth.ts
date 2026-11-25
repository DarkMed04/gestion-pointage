import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const loginSchema = z.object({
  username: z.string().trim().min(2),
  password: z.string().min(4),
});

async function ensureDefaultAdmin() {
  const usersCount = await prisma.user.count();
  if (usersCount === 0) {
    const passwordHash = await bcrypt.hash('Admin@1234', 12);
    await prisma.user.create({
      data: {
        nom: 'Administrateur Principal',
        username: 'admin',
        passwordHash,
        role: 'ADMIN',
        actif: true,
      },
    });
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12, // 12 ساعة
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await ensureDefaultAdmin();

        const user = await prisma.user.findUnique({
          where: { username: parsed.data.username.toLowerCase() },
        });

        if (!user || !user.actif) return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.nom,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: 'ADMIN' | 'SECURITY' }).role ?? 'SECURITY';
        token.username = (user as { username?: string }).username ?? '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? '');
        session.user.role = (token.role as 'ADMIN' | 'SECURITY') ?? 'SECURITY';
        session.user.username = String(token.username ?? '');
      }
      return session;
    },
  },
});