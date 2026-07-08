import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { UserService } from "../models/User.ts";

export function configurePassport() {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  // --- GOOGLE STRATEGY ---
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: `${appUrl}/api/auth/google/callback`,
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const provider = "google";
            const providerId = profile.id;
            const email = profile.emails?.[0]?.value || "";
            const profilePhoto = profile.photos?.[0]?.value || "";
            let username = profile.displayName || "";

            if (!username && email) {
              username = email.split("@")[0];
            }
            if (!username) {
              username = `google_user_${providerId}`;
            }

            // 1. Search by Provider & Provider ID
            let user = await UserService.findByProvider(provider, providerId);
            if (user) {
              await UserService.updateLastLogin(user.email);
              const updated = await UserService.findByProvider(provider, providerId);
              return done(null, updated || user);
            }

            // 2. Search by Email to link existing password accounts
            if (email) {
              const existingUser = await UserService.findByEmail(email);
              if (existingUser) {
                await UserService.linkProvider(email, provider, providerId, profilePhoto);
                const updated = await UserService.findByEmail(email);
                return done(null, updated || existingUser);
              }
            }

            // 3. Auto-generate Unique Username
            let finalUsername = username.replace(/[^a-zA-Z0-9_-]/g, "");
            if (finalUsername.length < 3) {
              finalUsername = `user_${providerId}`;
            }

            let usernameTaken = await UserService.findByUsername(finalUsername);
            let attempts = 0;
            while (usernameTaken && attempts < 5) {
              finalUsername = `${finalUsername}_${Math.floor(Math.random() * 1000)}`;
              usernameTaken = await UserService.findByUsername(finalUsername);
              attempts++;
            }

            // 4. Register new OAuth User
            const newUser = await UserService.createUser({
              username: finalUsername,
              email: email || `${finalUsername}@google.placeholder`,
              role: "user",
              provider,
              providerId,
              profilePhoto,
              lastLogin: new Date(),
            });

            return done(null, newUser);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
    console.log("🛡️ Passport: Google OAuth strategy registered.");
  } else {
    console.warn("⚠️ Passport: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google Auth strategy registration skipped.");
  }

  // --- GITHUB STRATEGY ---
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (githubClientId && githubClientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: githubClientId,
          clientSecret: githubClientSecret,
          callbackURL: `${appUrl}/api/auth/github/callback`,
          passReqToCallback: true,
          scope: ["user:email"], // Request emails to ensure RFC compliance
        },
        async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const provider = "github";
            const providerId = profile.id;
            const email = profile.emails?.[0]?.value || "";
            const profilePhoto = profile.photos?.[0]?.value || "";
            let username = profile.username || profile.displayName || "";

            if (!username && email) {
              username = email.split("@")[0];
            }
            if (!username) {
              username = `github_user_${providerId}`;
            }

            // 1. Search by Provider & Provider ID
            let user = await UserService.findByProvider(provider, providerId);
            if (user) {
              await UserService.updateLastLogin(user.email);
              const updated = await UserService.findByProvider(provider, providerId);
              return done(null, updated || user);
            }

            // 2. Search by Email to link existing password accounts
            if (email) {
              const existingUser = await UserService.findByEmail(email);
              if (existingUser) {
                await UserService.linkProvider(email, provider, providerId, profilePhoto);
                const updated = await UserService.findByEmail(email);
                return done(null, updated || existingUser);
              }
            }

            // 3. Auto-generate Unique Username
            let finalUsername = username.replace(/[^a-zA-Z0-9_-]/g, "");
            if (finalUsername.length < 3) {
              finalUsername = `user_${providerId}`;
            }

            let usernameTaken = await UserService.findByUsername(finalUsername);
            let attempts = 0;
            while (usernameTaken && attempts < 5) {
              finalUsername = `${finalUsername}_${Math.floor(Math.random() * 1000)}`;
              usernameTaken = await UserService.findByUsername(finalUsername);
              attempts++;
            }

            // 4. Register new OAuth User
            const newUser = await UserService.createUser({
              username: finalUsername,
              email: email || `${finalUsername}@github.placeholder`,
              role: "user",
              provider,
              providerId,
              profilePhoto,
              lastLogin: new Date(),
            });

            return done(null, newUser);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
    console.log("🛡️ Passport: GitHub OAuth strategy registered.");
  } else {
    console.warn("⚠️ Passport: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing. GitHub Auth strategy registration skipped.");
  }
}
