
import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      // Keep other default properties like name, email, image if needed
    } & DefaultSession["user"]; // Extends default user properties
  }

  // Augment the User type passed to JWT and session callbacks
  interface User extends DefaultUser {
    id: string;
    username: string;
    // You can add other custom fields from your AppUser type here
    // if you pass them from the authorize callback
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
     // You can add other custom fields here that you added to the token in the jwt callback
  }
}
