
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { mockUsers } from '@/lib/mock-data'; // Assuming mockUsers is an array of your User type
import type { User as AppUser } from '@/types'; // Your application's User type

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        emailOrUsername: { label: "Email or Username", type: "text", placeholder: "jsmith or jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.emailOrUsername || !credentials.password) {
          return null;
        }

        const user = mockUsers.find(
          u => (u.email.toLowerCase() === credentials.emailOrUsername.toLowerCase() ||
                u.username.toLowerCase() === credentials.emailOrUsername.toLowerCase())
        );

        // For mock purposes, we're not hashing passwords. In a real app, compare hashed passwords.
        // Also, in a real app, you'd check the password here.
        if (user) {
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
      // Persist the user id and username to the token right after signin
      // The `user` object here is what's returned from the `authorize` callback
      if (account && user) {
        token.id = user.id;
        token.username = user.username; // user.username is available from authorize's return
        // other fields from user like email, name, image are already part of the default token if needed
      }
      return token;
    },
    async session({ session, token }) {
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
  secret: process.env.NEXTAUTH_SECRET || 'super_secret_fallback_for_dev_env_32_chars_long',
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

