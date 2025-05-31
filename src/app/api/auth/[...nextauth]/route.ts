
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { mockUsers } from '@/lib/mock-data'; // Assuming mockUsers is an array of your User type
import type { User as AppUser } from '@/types'; // Your application's User type

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
          return null;
        }

        const user = mockUsers.find(
          u => (u.email.toLowerCase() === credentials.emailOrUsername.toLowerCase() ||
                u.username.toLowerCase() === credentials.emailOrUsername.toLowerCase())
        );

        // For mock purposes, we're not hashing passwords. In a real app, compare hashed passwords.
        // For this mock setup, we'll just check if the user exists.
        if (user) {
          console.log("NEXTAUTH_ROUTE.TS: Authorize - User found:", user.username);
          // This object structure should align with NextAuth's expected User type (DefaultUser)
          // and our augmented User type in next-auth.d.ts
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.username, // NextAuth uses 'name' for display, often maps to username or a full name
            image: user.profilePictureUrl, // NextAuth uses 'image' for avatar
          };
        }
        console.log("NEXTAUTH_ROUTE.TS: Authorize - User not found or invalid credentials for:", credentials.emailOrUsername);
        return null; // Login failed
      }
    })
  ],
  session: {
    strategy: 'jwt',
    // maxAge: 30 * 24 * 60 * 60, // 30 days - for "remember me" like behavior
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // console.log("NEXTAUTH_ROUTE.TS: JWT callback. User:", user, "Account:", account);
      // Persist the user id and username to the token right after signin
      // The `user` object here is what's returned from the `authorize` callback
      if (account && user) {
        token.id = user.id;
        token.username = user.username; // user.username is available from authorize's return
      }
      return token;
    },
    async session({ session, token }) {
      // console.log("NEXTAUTH_ROUTE.TS: Session callback. Token:", token);
      // Send properties to the client, like an access_token and user id from a provider.
      // `token` here is the JWT token object from the `jwt` callback
      if (session.user) { // Check if session.user exists
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
    // error: '/auth/error', // Custom error page
  },
  // Ensure NEXTAUTH_SECRET is set. Use a strong fallback for development.
  // The secret should be at least 32 characters long.
  secret: process.env.NEXTAUTH_SECRET || 'fallback_super_secret_for_dev_must_be_32_chars_or_longer',
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
console.log("NEXTAUTH_ROUTE.TS: NextAuth handler created.");


export { handler as GET, handler as POST };
