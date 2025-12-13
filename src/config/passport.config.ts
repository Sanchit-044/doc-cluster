import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { generateUniqueUsername } from "../utils/username.util";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"));

        let user = await prisma.user.findUnique({ where: { email } });

        const tempOAuthToken = jwt.sign(
          { email, provider: "google" },
          process.env.TEMP_JWT_SECRET!,
          { expiresIn: "5m" }
        );

        if (!user) {
          const baseUsername = email.split("@")[0];
          const username = await generateUniqueUsername(baseUsername);

          user = await prisma.user.create({
            data: {
              email,
              username,
              password: "OAUTH_USER",
              isEmailVerified: true,
              avatarUrl: profile.photos?.[0]?.value || null,
              googleId: profile.id,
              tempOAuthToken,
              streamKey: "",
            },
          });
        } else {
          await prisma.user.update({
            where: { email },
            data: {
              avatarUrl: profile.photos?.[0]?.value || null,
              isEmailVerified: true,
              googleId: profile.id,
              tempOAuthToken,
            },
          });
        }

        return done(null, { tempOAuthToken });
      } catch (err) {
        console.error("Google OAuth Error:", err);
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
      scope: ["user:email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from GitHub"));

        let user = await prisma.user.findUnique({ where: { email } });

        const tempOAuthToken = jwt.sign(
          { email, provider: "github" },
          process.env.TEMP_JWT_SECRET!,
          { expiresIn: "5m" }
        );

        if (!user) {
          const baseUsername = email.split("@")[0];
          const username = await generateUniqueUsername(baseUsername);

          user = await prisma.user.create({
            data: {
              email,
              username,
              password: "OAUTH_USER",
              isEmailVerified: true,
              avatarUrl: profile.photos?.[0]?.value || null,
              githubId: profile.id,
              tempOAuthToken,
              streamKey: "",
            },
          });
        } else {
          await prisma.user.update({
            where: { email },
            data: {
              avatarUrl: profile.photos?.[0]?.value || null,
              isEmailVerified: true,
              githubId: profile.id,
              tempOAuthToken,
            },
          });
        }

        return done(null, { tempOAuthToken });
      } catch (err) {
        console.error("GitHub OAuth Error:", err);
        return done(err as Error);
      }
    }
  )
);

export default passport;
