import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET_KEY environment variable is not set");
}

// Bypass strict type checking for jsonwebtoken
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const signed = jwt.sign as any;

export function generateToken(id: number, expiresIn: string = "24h"): string {
  return signed({ id }, JWT_SECRET, { expiresIn });
}

export default generateToken;
