
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan?: string;
      messagesLeft?: number;
    } & DefaultSession["user"];
  }

  interface User {
    plan?: string;
    messagesLeft?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    plan?: string;
    messagesLeft?: number;
  }
}
