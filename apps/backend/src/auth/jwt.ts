import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { Papel } from '../models/EmpresaUsuario.js'

export type TokenType = 'access' | 'refresh'

export type TokenPayload = {
  sub: string
  email: string
  nome: string
  empresaId?: string
  papel?: Papel
  tipo: TokenType
}

function sign(payload: TokenPayload, expiresIn: string) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: expiresIn as SignOptions['expiresIn'] })
}

export function signAccessToken(payload: Omit<TokenPayload, 'tipo'>) {
  return sign({ ...payload, tipo: 'access' }, env.accessTokenExpires)
}

export function signRefreshToken(payload: Omit<TokenPayload, 'tipo'>) {
  return sign({ ...payload, tipo: 'refresh' }, env.refreshTokenExpires)
}

export function verifyToken(token: string, type: TokenType): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret)
  if (typeof decoded === 'string' || decoded.tipo !== type) {
    throw new Error('Token inválido')
  }
  return decoded as TokenPayload
}
