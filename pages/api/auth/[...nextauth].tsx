import { IncomingMessage } from "http";
import { NextApiRequest, NextApiResponse } from "next"
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

export function getAuthOptions(req: IncomingMessage): NextAuthOptions {
  const providers = [
    CredentialsProvider({
      id: 'credentials',
      authorize: async (credentials) => {
        try {
          const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"));

          await siwe.validate(credentials?.signature || "");

          const { address, chainId } = siwe;

          const user = { id: address, address, chainId };

          return user;
        } catch (e) {
          console.log(e);
          return null;
        }
      },
      credentials: {
        message: {
          label: "Message",
          placeholder: "0x0",
          type: "text",
        },
        signature: {
          label: "Signature",
          placeholder: "0x0",
          type: "text",
        },
      },
      name: "credentials",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    })
  ];

  return {
    // https://next-auth.js.org/configuration/providers/oauth
    providers,
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async jwt({ token, user }: { token: any; user: any }) {
        console.log("callback token", token)
        user && (token.user = user);
        return token;
      },
    },
  };
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const authOptions = getAuthOptions(req);
  const isDefaultSigninPage = req.method === "GET" && req.query.nextauth.includes("signin")

  // Will hide the `GoogleProvider` when you visit `/api/auth/signin`
  if (isDefaultSigninPage) authOptions.providers.pop()

  return await NextAuth(req, res, authOptions)
}