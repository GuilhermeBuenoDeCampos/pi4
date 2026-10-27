import type { NextFunction, Request, Response } from 'express'
import { verifyToken, type TokenPayload } from './jwt.js'
import type { Papel } from '../models/EmpresaUsuario.js'

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload
    }
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Autenticação necessária.' })
    return
  }

  try {
    request.auth = verifyToken(header.slice(7), 'access')
    next()
  } catch {
    response.status(401).json({ message: 'Sessão expirada. Faça login novamente.' })
  }
}

export function requireCompany(request: Request, response: Response, next: NextFunction) {
  if (!request.auth?.empresaId) {
    response.status(400).json({ message: 'Selecione uma empresa para continuar.' })
    return
  }
  next()
}

export function requireRole(roles: Papel[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.auth?.papel || !roles.includes(request.auth.papel)) {
      response.status(403).json({ message: 'Você não tem permissão para esta ação.' })
      return
    }
    next()
  }
}
