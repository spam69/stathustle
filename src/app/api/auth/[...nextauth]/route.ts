
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { mockUsers } from '@/lib/mock-data'; 
import type { User as AppUserType } from '@/types'; 

console.log("NEXTAUTH_ROUTE.TS: Module loaded");
console.log("NEXTAUTH_ROUTE.TS: NEXTAUTH_SECRET from env:", process.env.NEXTAUTH_SECRET ? "Exists" : "MISSING or empty");
console.log("NEXTAUTH_ROUTE.TS: NEXTAUTH_URL from env:", process.env.NEXTAUTH_URL || "MISSING or empty");


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        emailOrUsername: { label: "Email or Username", type: "text", placeholder: "jsmith or jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log("NEXTAUTH_ROUTE.TS: Authorize callback hit with credentials:", credentials);

        if (!credentials?.emailOrUsername || !credentials.password) {
          console.error("NEXTAUTH_ROUTE.TS: Authorize - Missing credentials");
          throw new Error("Missing credentials."); // Throw an error for NextAuth to handle
        }

        const user = mockUsers.find(
          u => (u.email.toLowerCase() === credentials.emailOrUsername.toLowerCase() ||
                u.username.toLowerCase() === credentials.emailOrUsername.toLowerCase())
        );

        if (user && user.password === credentials.password) {
          console.log("NEXTAUTH_ROUTE.TS: Authorize - User found and password matches:", user.username);
          // This object structure should align with NextAuth's expected User type
          // and our augmented User type in next-auth.d.ts
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.username, 
            image: user.profilePictureUrl, 
          };
        } else if (user) {
            console.log("NEXTAUTH_ROUTE.TS: Authorize - User found, but password incorrect for:", credentials.emailOrUsername);
            throw new Error("Invalid credentials."); // Password incorrect
        } else {
            console.log("NEXTAUTH_ROUTE.TS: Authorize - User not found for:", credentials.emailOrUsername);
            throw new Error("Invalid credentials."); // User not found
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id;
        token.username = user.username; 
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { 
        if (token.id) {
          session.user.id = token.id as string;
        }
        if (token.username) {
          session.user.username = token.username as string;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback_super_secret_for_dev_must_be_32_chars_or_longer_wow',
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
console.log("NEXTAUTH_ROUTE.TS: NextAuth handler created.");


export { handler as GET, handler as POST };
