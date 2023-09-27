import { NextApiRequest, NextApiResponse } from "next"
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createAA } from "../../../helpers/aa";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // authorization: {
      //   params: {
      //     prompt: "consent",
      //     access_type: "offline",
      //     response_type: "code"
      //   }
      // }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      user && (token.user = user);
      return token;
    },
    async session({ token, session }) {
      try {
        await createAA(session, token?.sub || '', "1");
        return session;
      } catch (err) {
        throw err;
      }
    }
  },
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const isDefaultSigninPage = req.method === "GET" && req.query.nextauth?.includes("signin")

  // Will hide the `GoogleProvider` when you visit `/api/auth/signin`
  if (isDefaultSigninPage) authOptions.providers.pop()

  return await NextAuth(req, res, authOptions);
}