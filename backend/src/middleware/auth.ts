import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "./errorHandler";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Token não fornecido");
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub: number };
    req.userId = Number(payload.sub);
    next();
  } catch {
    throw new HttpError(401, "Token inválido ou expirado");
  }
}
