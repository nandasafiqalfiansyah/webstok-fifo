import { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { getDictionary } from '@/locales/dictionary'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export default prisma;
export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ user, token }) {
      if (user) {
        return { ...token, user: user as User }
      }
      return token
    },
    async session({ session, token }) {
      return { ...session, user: token.user }
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const { email, password } = credentials

        try {
          // Cari admin di database berdasarkan email
          const admin = await prisma.admin.findUnique({
            where: { email },
          })

          const dict = await getDictionary()

          // Cek apakah admin ditemukan
          if (!admin) {
            throw new Error(dict.login.message.auth_failed)
          }

          // Cek apakah password cocok
          const passwordMatch = await bcrypt.compare(password, admin.password)
          if (!passwordMatch) {
            throw new Error(dict.login.message.auth_failed)
          }

          return {
            id: admin.id.toString(),
            name: admin.nama,
            email: admin.email,
            password: admin.password,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw new Error('Internal server error')
        } finally {
          await prisma.$disconnect()
        }
      },
    }),
  ],
}