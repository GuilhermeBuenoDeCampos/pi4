import { Router } from 'express'
import { AvaliacaoPratica, AvaliacaoQuiz, Cargo, EmpresaUsuario, Usuario } from '../models/index.js'
import { requireAuth, requireCompany, requireRole } from '../auth/middleware.js'
import { asyncHandler } from '../utils/async-handler.js'

const router = Router()
const PASS_SCORE = 70

type PracticalItemStatus = 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICA'
const PRACTICAL_STATUSES: PracticalItemStatus[] = ['CONFORME', 'NAO_CONFORME', 'NAO_APLICA']

function parseJsonValue(value: unknown) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function serializeAssessment(assessment: AvaliacaoQuiz) {
  return {
    id: String(assessment.id),
    courseId: assessment.trilhaId,
    courseTitle: assessment.trilhaTitulo,
    score: assessment.pontuacao,
    correct: assessment.acertos,
    total: assessment.total,
    passed: assessment.aprovado,
    answers: parseJsonValue(assessment.respostas),
    submittedAt: assessment.criadoEm,
  }
}

function serializePractical(assessment: AvaliacaoPratica) {
  const avaliador = assessment.get('avaliador') as Usuario | null
  return {
    id: String(assessment.id),
    courseId: assessment.trilhaId,
    courseTitle: assessment.trilhaTitulo,
    score: assessment.pontuacao,
    passed: assessment.aprovado,
    items: parseJsonValue(assessment.itens),
    observacoes: assessment.observacoes,
    avaliador: avaliador?.nome ?? null,
    submittedAt: assessment.criadoEm,
  }
}

function normalizePracticalItems(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return null
  const items: { descricao: string; status: PracticalItemStatus; observacao: string }[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null
    const descricao = String((raw as { descricao?: unknown }).descricao ?? '').trim()
    const status = String((raw as { status?: unknown }).status ?? '').toUpperCase() as PracticalItemStatus
    const observacao = String((raw as { observacao?: unknown }).observacao ?? '').trim()
    if (!descricao || !PRACTICAL_STATUSES.includes(status)) return null
    items.push({ descricao: descricao.slice(0, 240), status, observacao: observacao.slice(0, 500) })
  }
  return items
}

router.post('/', requireAuth, requireCompany, asyncHandler(async (request, response) => {
  const courseId = String(request.body?.courseId ?? '').trim()
  const courseTitle = String(request.body?.courseTitle ?? '').trim()
  const correct = Number(request.body?.correct)
  const total = Number(request.body?.total)
  const answers = Array.isArray(request.body?.answers) ? request.body.answers : []

  if (!courseTitle) {
    response.status(400).json({ message: 'Informe o treinamento avaliado.' })
    return
  }
  if (!Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || correct < 0 || correct > total) {
    response.status(400).json({ message: 'Resultado do quiz inválido.' })
    return
  }

  const score = Math.round((correct / total) * 100)
  const assessment = await AvaliacaoQuiz.create({
    empresaId: BigInt(request.auth!.empresaId!),
    usuarioId: BigInt(request.auth!.sub),
    trilhaId: courseId ? courseId.slice(0, 120) : null,
    trilhaTitulo: courseTitle.slice(0, 200),
    pontuacao: score,
    acertos: correct,
    total,
    aprovado: score >= PASS_SCORE,
    respostas: answers,
  })

  response.status(201).json({ assessment: serializeAssessment(assessment) })
}))

router.post('/practical', requireAuth, requireCompany, requireRole(['ADMIN', 'GESTOR']), asyncHandler(async (request, response) => {
  const usuarioId = String(request.body?.usuarioId ?? '').trim()
  const courseId = String(request.body?.courseId ?? '').trim()
  const courseTitle = String(request.body?.courseTitle ?? '').trim()
  const observacoes = String(request.body?.observacoes ?? '').trim()
  const items = normalizePracticalItems(request.body?.items)

  if (!/^\d+$/.test(usuarioId)) {
    response.status(400).json({ message: 'Selecione o colaborador avaliado.' })
    return
  }
  if (!courseTitle) {
    response.status(400).json({ message: 'Informe a atividade avaliada.' })
    return
  }
  if (!items) {
    response.status(400).json({ message: 'Preencha os critérios do checklist com um status válido.' })
    return
  }

  const applicable = items.filter(item => item.status !== 'NAO_APLICA')
  if (applicable.length === 0) {
    response.status(400).json({ message: 'Marque pelo menos um critério como conforme ou não conforme.' })
    return
  }

  const empresaId = BigInt(request.auth!.empresaId!)
  const vinculo = await EmpresaUsuario.findOne({
    where: { empresaId, usuarioId: BigInt(usuarioId), status: ['ATIVO', 'CONVIDADO'] },
  })
  if (!vinculo) {
    response.status(404).json({ message: 'Colaborador não encontrado nesta empresa.' })
    return
  }

  const conforming = applicable.filter(item => item.status === 'CONFORME').length
  const score = Math.round((conforming / applicable.length) * 100)
  const assessment = await AvaliacaoPratica.create({
    empresaId,
    usuarioId: BigInt(usuarioId),
    avaliadorId: BigInt(request.auth!.sub),
    trilhaId: courseId ? courseId.slice(0, 120) : null,
    trilhaTitulo: courseTitle.slice(0, 200),
    pontuacao: score,
    aprovado: score >= PASS_SCORE,
    itens: items,
    observacoes: observacoes ? observacoes.slice(0, 4000) : null,
  })

  const saved = await AvaliacaoPratica.findByPk(assessment.id, {
    include: [{ model: Usuario, as: 'avaliador', attributes: ['id', 'nome'] }],
  })
  response.status(201).json({ assessment: serializePractical(saved ?? assessment) })
}))

router.get('/mine', requireAuth, requireCompany, asyncHandler(async (request, response) => {
  const assessments = await AvaliacaoQuiz.findAll({
    where: {
      empresaId: BigInt(request.auth!.empresaId!),
      usuarioId: BigInt(request.auth!.sub),
    },
    order: [['criadoEm', 'DESC'], ['id', 'DESC']],
  })
  response.json(assessments.map(serializeAssessment))
}))

router.get('/collaborators', requireAuth, requireCompany, requireRole(['ADMIN', 'GESTOR']), asyncHandler(async (request, response) => {
  const empresaId = BigInt(request.auth!.empresaId!)
  const vinculos = (await EmpresaUsuario.findAll({
    where: { empresaId, status: ['ATIVO', 'CONVIDADO'] },
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email', 'telefone', 'fotoUrl'] },
      { model: Cargo, as: 'cargo', attributes: ['id', 'nome'] },
    ],
    order: [['criadoEm', 'DESC']],
  })).filter(vinculo => String((vinculo.get('usuario') as Usuario).id) !== request.auth!.sub)

  const usuarioIds = vinculos.map(vinculo => (vinculo.get('usuario') as Usuario).id)
  const assessments = usuarioIds.length
    ? await AvaliacaoQuiz.findAll({
      where: { empresaId, usuarioId: usuarioIds },
      order: [['criadoEm', 'DESC'], ['id', 'DESC']],
    })
    : []

  const practicalAssessments = usuarioIds.length
    ? await AvaliacaoPratica.findAll({
      where: { empresaId, usuarioId: usuarioIds },
      include: [{ model: Usuario, as: 'avaliador', attributes: ['id', 'nome'] }],
      order: [['criadoEm', 'DESC'], ['id', 'DESC']],
    })
    : []

  const byUser = new Map<string, AvaliacaoQuiz[]>()
  for (const assessment of assessments) {
    const key = String(assessment.usuarioId)
    byUser.set(key, [...(byUser.get(key) ?? []), assessment])
  }

  const practicalByUser = new Map<string, AvaliacaoPratica[]>()
  for (const assessment of practicalAssessments) {
    const key = String(assessment.usuarioId)
    practicalByUser.set(key, [...(practicalByUser.get(key) ?? []), assessment])
  }

  response.json(vinculos.map(vinculo => {
    const usuario = vinculo.get('usuario') as Usuario
    const cargo = vinculo.get('cargo') as Cargo | null
    const attempts = byUser.get(String(usuario.id)) ?? []
    const practical = practicalByUser.get(String(usuario.id)) ?? []
    const average = attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.pontuacao, 0) / attempts.length)
      : null

    return {
      id: String(vinculo.id),
      usuarioId: String(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      fotoUrl: usuario.fotoUrl,
      cargo: cargo?.nome ?? null,
      papel: vinculo.papel,
      status: vinculo.status,
      totalAvaliacoes: attempts.length,
      media: average,
      aprovadas: attempts.filter(attempt => attempt.aprovado).length,
      ultimaAvaliacao: attempts[0] ? serializeAssessment(attempts[0]) : null,
      avaliacoes: attempts.map(serializeAssessment),
      totalPraticas: practical.length,
      aprovadasPraticas: practical.filter(assessment => assessment.aprovado).length,
      praticas: practical.map(serializePractical),
    }
  }))
}))

export default router
