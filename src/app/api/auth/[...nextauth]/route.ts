
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
        if (user) { // && user.password === credentials.password (if passwords were stored, and hashed)
          // IMPORTANT: The object returned here is what populates the `user` object in JWT and session callbacks
          return { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            name: user.username, // NextAuth typically expects a 'name' property
            image: user.profilePictureUrl, // NextAuth typically expects an 'image' property
            // ... any other fields from your AppUser you want in the token initially
          } as any; // Using 'as any' here because we're shaping the User object for NextAuth
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
      if (account && user) {
        return {
          ...token,
          id: user.id,
          username: (user as AppUser).username, // Cast to your AppUser if username is not on DefaultUser
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user && token.id && token.username) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        // You can add other properties from the token to the session.user here
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    // error: '/auth/error', // Custom error page
  },
  secret: process.env.NEXTAUTH_SECRET || 'your_very_secure_secret_here_in_production', // Fallback for development
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
