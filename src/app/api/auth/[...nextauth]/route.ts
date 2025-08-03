
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { FirebaseAdapter } from '@auth/firebase-adapter';
import { adminAuth } from '@/lib/firebase/admin';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: FirebaseAdapter(adminAuth),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };
