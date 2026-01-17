import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const { JWT_SECRET, NODE_ENV } = process.env;
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

  const isProd = NODE_ENV === "production";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProd,                 // true on Render
    sameSite: isProd ? "none" : "lax" // ✅ key change
  });

  return token;
};
