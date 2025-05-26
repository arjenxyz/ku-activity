import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecretkey"; // .env dosyasına koyman gerek

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}
