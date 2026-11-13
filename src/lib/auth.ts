import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { encryptGitHubToken } from "@/lib/github-token";

const prismaAdapter = PrismaAdapter(prisma);

const authAdapter: Adapter = {
  ...prismaAdapter,
  linkAccount: async (account: AdapterAccount) => {
    if (!prismaAdapter.linkAccount) throw new Error("GitHub account linking is unavailable.");
    const encryptedAccount = account.provider === "github"
      ? { ...account, access_token: encryptGitHubToken(account.access_token) }
      : account;
    return prismaAdapter.linkAccount(
      encryptedAccount as Parameters<NonNullable<typeof prismaAdapter.linkAccount>>[0],
    );
  },
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
    adapter: authAdapter,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      issuer: "https://github.com/login/oauth",
      // Repository contents are public-only; do not request GitHub's broad `repo` scope.
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};

