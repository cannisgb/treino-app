import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Igual ao Look Signature (credenciais + JWT), mas com o seu próprio
// NEXTAUTH_SECRET e domínio: as sessões das duas apps nunca se cruzam.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      if (trigger === "update") token.mustChangePassword = false;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
