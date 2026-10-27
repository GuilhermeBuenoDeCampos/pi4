import { createHash, randomBytes } from 'node:crypto'
import { TokenSenha, type TipoTokenSenha } from '../models/TokenSenha.js'
import { env } from '../config/env.js'

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createOneTimeToken(usuarioId: bigint, tipo: TipoTokenSenha) {
  const token = randomBytes(32).toString('hex')
  const expiraEm = new Date(Date.now() + env.passwordTokenExpiresMinutes * 60 * 1000)
  await TokenSenha.create({ usuarioId, tipo, tokenHash: hashToken(token), expiraEm, usadoEm: null })
  return { token, expiraEm }
}

export function buildPasswordLink(token: string) {
  return `${env.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`
}
