// /lib/auth.ts
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

/**
 * Payload esperado en el JWT
 */
type JwtPayload = {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
};

/**
 * Extrae token de header 'Authorization: Bearer <token>' o de cookie 'token'
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // NextRequest.cookies.get -> retorna { name, value } o undefined
  const cookie = req.cookies.get("token")?.value;
  if (cookie) return cookie;

  return null;
}

/**
 * Verifica token y retorna el payload o null.
 * Lanza si quieres forzar manejo de error en rutas.
 */
export function verifyToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development') as JwtPayload;
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Requiere autenticación: retorna payload o lanza Error
 */
export function requireAuth(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const payload = verifyToken(token);
  if (!payload) throw new Error("Unauthenticated");
  return payload;
}
