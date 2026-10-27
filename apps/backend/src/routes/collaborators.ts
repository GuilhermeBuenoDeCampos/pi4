import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { Cargo, Empresa, EmpresaUsuario, Usuario } from '../models/index.js'
import type { Papel } from '../models/EmpresaUsuario.js'
import { requireAuth, requireCompany, requireRole } from '../auth/middleware.js'
import { buildPasswordLink, createOneTimeToken } from '../services/token-senha.js'
import { inviteEmailHtml, sendMail } from '../services/mailer.js'
import { asyncHandler } from '../utils/async-handler.js'

const router = Router()
const papeis: Papel[] = ['ADMIN', 'GESTOR', 'INSTRUTOR', 'COLABORADOR']

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

router.post(
  '/',
  requireAuth,
  requireCompany,
  requireRole(['ADMIN', 'GESTOR']),
  asyncHandler(async (request, response) => {
    const nome = String(request.body?.nome ?? '').trim()
    const email = normalizeEmail(request.body?.email)
    const telefone = String(request.body?.telefone ?? '').trim() || null
    const cargoNome = String(request.body?.cargo ?? '').trim()
    const papel = String(request.body?.papel ?? 'COLABORADOR').toUpperCase() as Papel
    const empresaId = BigInt(request.auth!.empresaId!)

    if (!nome || !email) {
      response.status(400).json({ message: 'Informe nome e e-mail do colaborador.' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      response.status(400).json({ message: 'Informe um e-mail válido.' })
      return
    }

    if (!papeis.includes(papel)) {
      response.status(400).json({ message: 'Permissão inválida.' })
      return
    }

    const empresa = await Empresa.findByPk(empresaId)
    if (!empresa) {
      response.status(404).json({ message: 'Empresa não encontrada.' })
      return
    }

    let usuario = await Usuario.findOne({ where: { email } })
    const usuarioCriado = !usuario

    if (!usuario) {
      usuario = await Usuario.create({
        nome,
        email,
        telefone,
        senhaHash: await bcrypt.hash(randomUUID(), 10),
        ativo: true,
      })
    } else if (telefone && !usuario.telefone) {
      usuario.telefone = telefone
      await usuario.save()
    }

    const vinculoExistente = await EmpresaUsuario.findOne({
      where: { empresaId, usuarioId: usuario.id },
    })

    if (vinculoExistente) {
      response.status(409).json({
        message: 'Este e-mail já está vinculado a esta empresa.',
        alreadyLinked: true,
      })
      return
    }

    let cargoId: bigint | null = null
    if (cargoNome) {
      const [cargo] = await Cargo.findOrCreate({
        where: { empresaId, nome: cargoNome },
        defaults: { empresaId, nome: cargoNome, descricao: null },
      })
      cargoId = cargo.id
    }

    const vinculo = await EmpresaUsuario.create({
      empresaId,
      usuarioId: usuario.id,
      cargoId,
      papel,
      status: usuarioCriado ? 'CONVIDADO' : 'ATIVO',
      dataEntrada: new Date(),
    })

    let devInviteToken: string | undefined
    if (usuarioCriado) {
      const { token } = await createOneTimeToken(usuario.id, 'CONVITE')
      await sendMail({
        to: usuario.email,
        subject: `Convite para acessar ${empresa.nomeFantasia}`,
        html: inviteEmailHtml(usuario.nome, empresa.nomeFantasia, buildPasswordLink(token)),
      })
      if (process.env.NODE_ENV !== 'production') devInviteToken = token
    }

    response.status(201).json({
      message: usuarioCriado
        ? 'Colaborador criado e convite enviado por e-mail.'
        : 'Colaborador já possuía cadastro e foi vinculado à empresa.',
      createdUser: usuarioCriado,
      inviteToken: devInviteToken,
      collaborator: {
        id: String(vinculo.id),
        usuarioId: String(usuario.id),
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        cargo: cargoNome || null,
        papel: vinculo.papel,
        status: vinculo.status,
      },
    })
  }),
)

export default router
