import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { Cargo, Empresa, EmpresaUsuario, TokenSenha, Usuario } from '../models/index.js'
import { requireAuth } from '../auth/middleware.js'
import { signAccessToken, signRefreshToken, verifyToken } from '../auth/jwt.js'
import { buildPasswordLink, createOneTimeToken, hashToken } from '../services/token-senha.js'
import { resetEmailHtml, sendMail } from '../services/mailer.js'
import { env } from '../config/env.js'
import { asyncHandler } from '../utils/async-handler.js'

const router = Router()

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function serializarEmpresa(vinculo: EmpresaUsuario) {
  const empresa = vinculo.get('empresa') as Empresa
  const cargo = vinculo.get('cargo') as Cargo | null
  return {
    id: String(vinculo.empresaId),
    nomeFantasia: empresa.nomeFantasia,
    razaoSocial: empresa.razaoSocial,
    cnpj: empresa.cnpj,
    papel: vinculo.papel,
    status: vinculo.status,
    cargo: cargo?.nome ?? null,
  }
}

async function carregarEmpresas(usuarioId: bigint) {
  const vinculos = await EmpresaUsuario.findAll({
    where: { usuarioId, status: { [Op.in]: ['ATIVO', 'CONVIDADO'] } },
    include: [
      { model: Empresa, as: 'empresa', required: true, where: { ativa: true } },
      { model: Cargo, as: 'cargo', required: false },
    ],
    order: [['id', 'ASC']],
  })
  return vinculos.map(serializarEmpresa)
}

function usuarioPublico(usuario: Usuario) {
  return {
    id: String(usuario.id),
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
  }
}

router.post('/login', asyncHandler(async (request, response) => {
  const email = normalizeEmail(request.body?.email)
  const senha = String(request.body?.senha ?? '')

  if (!email || !senha) {
    response.status(400).json({ message: 'Informe e-mail e senha.' })
    return
  }

  const usuario = await Usuario.findOne({ where: { email } })
  if (!usuario || !usuario.ativo) {
    response.status(401).json({ message: 'E-mail ou senha inválidos.' })
    return
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash)
  if (!senhaValida) {
    response.status(401).json({ message: 'E-mail ou senha inválidos.' })
    return
  }

  const companies = await carregarEmpresas(usuario.id)
  if (!companies.length) {
    response.status(403).json({ message: 'Seu usuário ainda não está vinculado a nenhuma empresa ativa.' })
    return
  }

  const base = { sub: String(usuario.id), email: usuario.email, nome: usuario.nome }

  response.json({
    user: usuarioPublico(usuario),
    companies,
    accessToken: signAccessToken(base),
    refreshToken: signRefreshToken(base),
    requiresCompanySelection: companies.length > 1,
  })
}))

router.post('/select-company', requireAuth, asyncHandler(async (request, response) => {
  const empresaId = String(request.body?.empresaId ?? '')
  if (!/^\d+$/.test(empresaId)) {
    response.status(400).json({ message: 'Empresa inválida.' })
    return
  }

  const vinculo = await EmpresaUsuario.findOne({
    where: {
      usuarioId: request.auth!.sub,
      empresaId,
      status: { [Op.in]: ['ATIVO', 'CONVIDADO'] },
    },
    include: [
      { model: Empresa, as: 'empresa', required: true, where: { ativa: true } },
      { model: Cargo, as: 'cargo', required: false },
    ],
  })

  if (!vinculo) {
    response.status(403).json({ message: 'Você não tem acesso a esta empresa.' })
    return
  }

  const payload = {
    sub: request.auth!.sub,
    email: request.auth!.email,
    nome: request.auth!.nome,
    empresaId: String(vinculo.empresaId),
    papel: vinculo.papel,
  }

  response.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    activeCompany: serializarEmpresa(vinculo),
  })
}))

router.get('/me', requireAuth, asyncHandler(async (request, response) => {
  const usuario = await Usuario.findByPk(request.auth!.sub)
  if (!usuario || !usuario.ativo) {
    response.status(401).json({ message: 'Usuário não encontrado.' })
    return
  }

  const companies = await carregarEmpresas(usuario.id)
  const activeCompany = request.auth!.empresaId
    ? companies.find(company => company.id === request.auth!.empresaId) ?? null
    : null

  response.json({ user: usuarioPublico(usuario), companies, activeCompany })
}))

router.post('/refresh', asyncHandler(async (request, response) => {
  const refreshToken = String(request.body?.refreshToken ?? '')
  if (!refreshToken) {
    response.status(400).json({ message: 'Refresh token não informado.' })
    return
  }

  try {
    const payload = verifyToken(refreshToken, 'refresh')
    const base = {
      sub: payload.sub,
      email: payload.email,
      nome: payload.nome,
      empresaId: payload.empresaId,
      papel: payload.papel,
    }
    response.json({
      accessToken: signAccessToken(base),
      refreshToken: signRefreshToken(base),
    })
  } catch {
    response.status(401).json({ message: 'Sessão expirada. Faça login novamente.' })
  }
}))

router.post('/logout', (_request, response) => {
  response.json({ message: 'Sessão encerrada.' })
})

router.post('/forgot-password', asyncHandler(async (request, response) => {
  const email = normalizeEmail(request.body?.email)
  if (!email) {
    response.status(400).json({ message: 'Informe o e-mail cadastrado.' })
    return
  }

  const usuario = await Usuario.findOne({ where: { email } })
  let devToken: string | undefined

  if (usuario && usuario.ativo) {
    const { token } = await createOneTimeToken(usuario.id, 'RESET')
    const link = buildPasswordLink(token)
    await sendMail({
      to: usuario.email,
      subject: 'Redefinição de senha - Infinity Code',
      html: resetEmailHtml(usuario.nome, link),
    })
    if (process.env.NODE_ENV !== 'production') devToken = token
  }

  response.json({
    message: 'Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.',
    devToken,
  })
}))

router.post('/reset-password', asyncHandler(async (request, response) => {
  const token = String(request.body?.token ?? '').trim()
  const senha = String(request.body?.senha ?? '')

  if (!token) {
    response.status(400).json({ message: 'Informe o código de redefinição.' })
    return
  }

  if (senha.length < 8) {
    response.status(400).json({ message: 'A senha deve ter no mínimo 8 caracteres.' })
    return
  }

  const registro = await TokenSenha.findOne({
    where: { tokenHash: hashToken(token), usadoEm: null },
    order: [['id', 'DESC']],
  })

  if (!registro) {
    response.status(400).json({ message: 'Código de redefinição inválido.' })
    return
  }

  if (registro.expiraEm.getTime() < Date.now()) {
    response.status(400).json({ message: 'Código de redefinição expirado. Solicite um novo.' })
    return
  }

  const usuario = await Usuario.findByPk(registro.usuarioId)
  if (!usuario) {
    response.status(400).json({ message: 'Usuário não encontrado.' })
    return
  }

  usuario.senhaHash = await bcrypt.hash(senha, 10)
  await usuario.save()

  registro.usadoEm = new Date()
  await registro.save()

  await EmpresaUsuario.update(
    { status: 'ATIVO' },
    { where: { usuarioId: usuario.id, status: 'CONVIDADO' } },
  )

  response.json({ message: 'Senha redefinida com sucesso. Você já pode entrar.' })
}))

router.get('/config', (_request, response) => {
  response.json({ tokenExpiresInMinutes: env.passwordTokenExpiresMinutes })
})

export default router
