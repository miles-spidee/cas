import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cas-secret-key-change-in-production";

/**
 * Middleware: verify JWT and attach user info to req.user
 * Expected token payload: { id, email, name, role, department_id, department_name }
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware: require the logged-in user to have role = HOD
 * Must be used AFTER requireAuth
 */
export function requireHOD(req, res, next) {
  if (!req.user || req.user.role !== "HOD") {
    return res.status(403).json({ error: "HOD access required" });
  }
  next();
}

export { JWT_SECRET };
