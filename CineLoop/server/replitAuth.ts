import type { Express, Request, Response, NextFunction } from "express";

/**
 * setupAuth:
 * - If Replit forwards user headers, populate req.user
 * - No Passport, no sessions; just lightweight header-based auth
 */
export async function setupAuth(app: Express) {
  app.use((req: any, _res: Response, next: NextFunction) => {
    // If Replit provided user headers, trust them
    const uid =
      req.get("X-Replit-User-Id") ||
      req.get("x-replit-user-id") ||
      req.headers["x-replit-user-id"];

    const uname =
      (req.get("X-Replit-User-Name") ||
        req.get("x-replit-user-name") ||
        (req.headers["x-replit-user-name"] as string)) ?? undefined;

    if (uid && !req.user) {
      req.user = { claims: { sub: String(uid), username: uname || "replit" } };
    }
    next();
  });
}

/**
 * isAuthenticated:
 * - In production: require req.user
 * - In development: inject a fake user so you can build without full auth flow
 *   (You can also pass Authorization: Bearer DEV to force the dev user.)
 */
export function isAuthenticated(req: any, res: Response, next: NextFunction) {
  // Already authenticated (from Replit headers or earlier middleware)
  if (req.user?.claims?.sub) return next();

  // Allow a bearer DEV token to short-circuit in any env if you want
  const auth = req.get("Authorization");
  if (auth && auth.startsWith("Bearer ") && auth.slice(7).trim().toUpperCase() === "DEV") {
    req.user = { claims: { sub: "dev-user", username: "dev" } };
    return next();
  }

  // In dev, auto-inject a user so Preview works
  if (process.env.NODE_ENV !== "production") {
    req.user = { claims: { sub: "dev-user", username: "dev" } };
    return next();
  }

  // Production and no user => block
  return res.status(401).json({ message: "Unauthenticated" });
}