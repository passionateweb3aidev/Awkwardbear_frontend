import NextAuth, { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

// Twitter profile 类型定义（OAuth 2.0）
interface TwitterProfile {
  id_str?: string;
  screen_name?: string;
  id?: string;
  username?: string;
  data?: {
    id?: string;
    username?: string;
  };
}

const useSecureCookies =
  process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const hostPrefix = useSecureCookies ? "__Host-" : "";

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // 使用 OAuth 2.0

      authorization: {
        url: "https://x.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read follows.read offline.access",
          response_type: "code",
          code_challenge_method: "S256",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 保存 Twitter OAuth 信息到 token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.providerAccountId = account.providerAccountId;
        // 保存 OAuth code（如果可用）
        // 注意：NextAuth 在内部处理了 code 交换，但我们可以保存其他信息
        token.twitterAccessToken = account.access_token;
      }
      if (profile) {
        // Twitter OAuth 2.0 profile 结构
        const twitterProfile = profile as TwitterProfile;
        token.twitterId = twitterProfile.id_str || twitterProfile.data?.id || twitterProfile.id;
        token.twitterUsername =
          twitterProfile.screen_name || twitterProfile.data?.username || twitterProfile.username;
      }
      return token;
    },
    async session({ session, token }) {
      // 将 Twitter 信息添加到 session
      if (token.twitterId) {
        session.user = {
          ...session.user,
          id: token.twitterId as string,
          name: token.twitterUsername as string,
        };
      }
      // 将 OAuth token 信息保存到 session
      session.accessToken = token.accessToken as string;
      session.providerAccountId = token.providerAccountId as string;
      return session;
    },
  },
  pages: {
    signIn: "/", // 自定义登录页面（可选）
  },
  session: {
    strategy: "jwt", // 使用 JWT session
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: `${hostPrefix}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        maxAge: 900,
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        maxAge: 900,
      },
    },
  },
  // 设置 secret（生产环境必须，开发环境提供个 fallback）
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key-at-least-32-chars-long",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
