import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL
      const existing = await prisma.user.findUnique({
        where: { email: user.email! },
      })
      if (existing) return true
      if (user.email === adminEmail) return true
      return false
    },
    async session({ session, user }) {
      session.user.id = user.id
      session.user.role = (user as { role?: string }).role ?? 'ADMIN'
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
})
