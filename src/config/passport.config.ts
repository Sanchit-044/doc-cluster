import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { prisma } from "../config/prisma";
import jwt from "jsonwebtoken";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        const tempOAuthToken = jwt.sign(
          { email },
          process.env.TEMP_JWT_SECRET!,
          { expiresIn: "1m" }
        );

        if (user) {
          await prisma.user.update({
            where: { email },
            data: {
              isEmailVerified: true,
              avatarInfo: profile.photos?.[0]?.value
                ? { google: profile.photos[0].value }
                : undefined,
            },
          });
        }

        return done(null, { tempOAuthToken });
      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err as Error);
      }
    }
  )
);


passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.BASE_URL}/auth/github/callback`,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GitHubProfile,
      done: (error: Error | null, user?: { tempOAuthToken: string }) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in GitHub profile"));
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });
        const tempOAuthToken = jwt.sign({ email }, process.env.TEMP_JWT_SECRET!, { expiresIn: "1m" });

        if (user) {
          const updateData: {
            profileImage: string | null;
            isEmailVerified: boolean;
            tempOAuthToken: string;
            githubId?: string;
          } = {
            profileImage: profile.photos?.[0]?.value || null,
            isEmailVerified: true,
            tempOAuthToken,
          };

     

          user = await prisma.user.update({
            where: { email },
            data: updateData,
          });
        }

        done(null, { tempOAuthToken });
      } catch (err) {
        done(err as Error);
      }
    }
  )
);

export default passport;