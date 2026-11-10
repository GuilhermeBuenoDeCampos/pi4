import { Router } from 'express'
import { Op } from 'sequelize'
import { sequelize } from '../database/sequelize.js'
import { Atribuicao, Avaliacao, EmpresaUsuario, Material, Progresso, Trilha, TrilhaMaterial, Video } from '../models/index.js'
import { requireAuth, requireCompany, requireRole } from '../auth/middleware.js'
import { asyncHandler } from '../utils/async-handler.js'
import { avaliarConhecimento } from '../services/avaliacaoIA.js'

const router = Router()
const creatorRoles = ['ADMIN', 'GESTOR', 'INSTRUTOR'] as const

function youtubeId(value: unknown) {
  const input = String(value ?? '').trim()
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^?&/]+)/i)
  return match?.[1] ?? input
}

function getVideo(material: Material) {
  return material.get('video') as Video | null
}

function parseQuiz(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return null
  const questions = value.map(raw => {
    if (!raw || typeof raw !== 'object') return null
    const question = raw as { statement?: unknown; options?: unknown; answer?: unknown; explanation?: unknown }
    const statement = String(question.statement ?? '').trim()
    const options = Array.isArray(question.options) ? question.options.map(option => String(option ?? '').trim()) : []
    const answer = Number(question.answer)
    const explanation = String(question.explanation ?? '').trim()
    if (!statement || options.length < 2 || options.length > 6 || options.some(option => !option)
      || !Number.isInteger(answer) || answer < 0 || answer >= options.length || !explanation) return null
    return { statement: statement.slice(0, 500), options: options.map(option => option.slice(0, 300)), answer, explanation: explanation.slice(0, 1000) }
  })
  return questions.every(Boolean) ? questions : null
}

function orderedMaterials(training: Trilha) {
  const materials = (training.get('materiais') as (Material & { Video?: Video | null })[] | undefined) ?? []
  return materials.sort((left, right) => {
    const leftOrder = Number((left as Material & { TrilhaMaterial?: { ordem?: number } }).TrilhaMaterial?.ordem ?? 0)
    const rightOrder = Number((right as Material & { TrilhaMaterial?: { ordem?: number } }).TrilhaMaterial?.ordem ?? 0)
    return leftOrder - rightOrder
  })
}

async function loadTrainingMaterials(trilhaId: bigint, empresaId: bigint) {
  const links = await TrilhaMaterial.findAll({
    where: { trilhaId, empresaId },
    include: [{
      model: Material,
      as: 'material',
      required: true,
      where: { empresaId, tipo: 'VIDEO', ativo: true },
      include: [{ model: Video, as: 'video', required: true }],
    }],
    order: [['ordem', 'ASC']],
  })

  return links
    .map(link => link.get('material') as Material | null)
    .filter((material): material is Material => material !== null)
}

async function getOrCreateAssignment(trilhaId: bigint, empresaId: bigint, usuarioId: bigint) {
  const membership = await EmpresaUsuario.findOne({ where: { empresaId, usuarioId, status: 'ATIVO' } })
  if (!membership) return null

  const [assignment] = await Atribuicao.findOrCreate({
    where: { empresaId, empresaUsuarioId: membership.id, trilhaId },
    defaults: {
      empresaId,
      empresaUsuarioId: membership.id,
      trilhaId,
      atribuidoPor: null,
      prazo: null,
      status: 'PENDENTE',
    },
  })
  return assignment
}

async function saveLessonProgress(trilhaId: bigint, materialId: bigint, empresaId: bigint, usuarioId: bigint, status: 'EM_ANDAMENTO' | 'CONCLUIDO') {
  const link = await TrilhaMaterial.findOne({ where: { trilhaId, materialId, empresaId } })
  if (!link) return

  const assignment = await getOrCreateAssignment(trilhaId, empresaId, usuarioId)
  if (!assignment) return

  const [progress] = await Progresso.findOrCreate({
    where: { atribuicaoId: assignment.id, trilhaMaterialId: link.id },
    defaults: {
      empresaId,
      atribuicaoId: assignment.id,
      trilhaMaterialId: link.id,
      status,
      percentual: status === 'CONCLUIDO' ? 100 : 1,
      concluidoEm: status === 'CONCLUIDO' ? new Date() : null,
    },
  })
  if (progress.status !== 'CONCLUIDO' || status === 'CONCLUIDO') {
    await progress.update({
      status,
      percentual: status === 'CONCLUIDO' ? 100 : Math.max(progress.percentual, 1),
      concluidoEm: status === 'CONCLUIDO' ? new Date() : progress.concluidoEm,
    })
  }
  if (assignment.status === 'PENDENTE') await assignment.update({ status: 'EM_ANDAMENTO' })
}

async function getTrainingProgress(trilhaId: bigint, empresaId: bigint, usuarioId: bigint, totalLessons: number) {
  if (!totalLessons) return { progress: 0, status: 'Pendente' }

  const assignment = await getOrCreateAssignment(trilhaId, empresaId, usuarioId)
  if (!assignment) return { progress: 0, status: 'Pendente' }

  const completedLessons = await Progresso.count({
    where: { empresaId, atribuicaoId: assignment.id, status: 'CONCLUIDO' },
  })
  const progress = Math.min(100, Math.round((completedLessons / totalLessons) * 100))
  return {
    progress,
    status: progress >= 100 ? 'Concluído' : progress > 0 ? 'Em andamento' : 'Pendente',
  }
}

async function serializeTraining(training: Trilha, empresaId: bigint, usuarioId: bigint) {
  const materials = orderedMaterials(training)
  const trainingProgress = await getTrainingProgress(BigInt(training.id), empresaId, usuarioId, materials.length)
  return {
    id: String(training.id),
    title: training.titulo,
    area: training.area ?? '',
    progress: trainingProgress.progress,
    status: trainingProgress.status,
    description: training.descricao ?? '',
    instructor: training.instrutor ?? '',
    duration: training.duracao ?? '',
    videos: materials.map((material, index) => {
      const video = getVideo(material)
      return {
        materialId: String(material.id),
        videoIndex: index,
        title: material.titulo,
        duration: video?.duracaoSegundos ? `${Math.floor(video.duracaoSegundos / 60)}:${String(video.duracaoSegundos % 60).padStart(2, '0')}` : '',
        youtubeId: youtubeId(video?.url),
        transcript: video?.transcricao ?? '',
      }
    }),
    quiz: parseQuiz(training.quiz),
    pops: [],
    fichas: [],
  }
}

router.get('/', requireAuth, requireCompany, asyncHandler(async (request, response) => {
  const trainings = await Trilha.findAll({
    subQuery: false,
    where: { empresaId: BigInt(request.auth!.empresaId!), ativa: true },
    include: [{
      model: Material,
      as: 'materiais',
      where: { empresaId: BigInt(request.auth!.empresaId!), tipo: 'VIDEO', ativo: true },
      required: false,
      include: [{ model: Video, as: 'video', required: false }],
      through: { attributes: ['ordem'] },
    }],
    order: [['criadoEm', 'DESC']],
  })
  const empresaId = BigInt(request.auth!.empresaId!)
  const usuarioId = BigInt(request.auth!.sub)
  response.json(await Promise.all(trainings.map(training => serializeTraining(training, empresaId, usuarioId))))
}))

router.post('/', requireAuth, requireCompany, requireRole([...creatorRoles]), asyncHandler(async (request, response) => {
  const title = String(request.body?.title ?? '').trim()
  const area = String(request.body?.area ?? '').trim()
  const description = String(request.body?.description ?? '').trim()
  const instructor = String(request.body?.instructor ?? '').trim()
  const duration = String(request.body?.duration ?? '').trim()
  const videos = Array.isArray(request.body?.videos) ? request.body.videos : []
  const quiz = request.body?.quiz === undefined ? null : parseQuiz(request.body.quiz)
  if (!title || !area || !description || !instructor || !duration) {
    response.status(400).json({ message: 'Informe nome, área, descrição, instrutor e carga horária.' })
    return
  }
  if (videos.some((video: unknown) => !video || typeof video !== 'object' || !String((video as { title?: unknown }).title ?? '').trim() || !youtubeId((video as { youtubeId?: unknown }).youtubeId))) {
    response.status(400).json({ message: 'Cada aula deve ter título e um vídeo válido.' })
    return
  }
  if (request.body?.quiz !== undefined && request.body.quiz !== null && !quiz) {
    response.status(400).json({ message: 'Cada pergunta do quiz deve ter enunciado, de 2 a 6 opções, resposta correta e explicação.' })
    return
  }

  const empresaId = BigInt(request.auth!.empresaId!)
  const training = await sequelize.transaction(async transaction => {
    const created = await Trilha.create({
      empresaId,
      titulo: title,
      area,
      descricao: description,
      instrutor: instructor,
      duracao: duration,
      quiz,
      obrigatoria: false,
      ativa: true,
    }, { transaction })

    for (const [index, rawVideo] of videos.entries()) {
      const video = rawVideo as { title: string; duration?: string; youtubeId: string; transcript?: string }
      const material = await Material.create({
        empresaId,
        titulo: String(video.title).trim(),
        descricao: null,
        tipo: 'VIDEO',
        versao: 1,
        ativo: true,
      }, { transaction })
      await Video.create({
        materialId: material.id,
        url: youtubeId(video.youtubeId),
        duracaoSegundos: parseDuration(video.duration),
        transcricao: String(video.transcript ?? '').trim() || null,
      }, { transaction })
      await TrilhaMaterial.create({
        empresaId,
        trilhaId: created.id,
        materialId: material.id,
        ordem: index + 1,
        obrigatorio: true,
      }, { transaction })
    }
    return created
  })

  const saved = await Trilha.findOne({
    subQuery: false,
    where: { id: training.id, empresaId },
    include: [{
      model: Material,
      as: 'materiais',
      required: false,
      include: [{ model: Video, as: 'video', required: false }],
      through: { attributes: ['ordem'] },
    }],
  })
  response.status(201).json({ training: saved ? await serializeTraining(saved, empresaId, BigInt(request.auth!.sub)) : null })
}))

router.post('/:id/evaluate', requireAuth, requireCompany, asyncHandler(async (request, response) => {
  const id = typeof request.params.id === 'string' ? request.params.id : ''
  const requestedMaterialId = String(request.body?.materialId ?? '').trim()
  const requestedVideoIndex = Number(request.body?.videoIndex)
  const requestedYoutubeId = youtubeId(request.body?.youtubeId)
  const requestedVideoTitle = String(request.body?.videoTitle ?? '').trim().toLocaleLowerCase()
  const collaboratorTranscript = String(request.body?.transcript ?? '').trim()
  if (!/^\d+$/.test(id) || (!/^\d+$/.test(requestedMaterialId) && !requestedYoutubeId) || !collaboratorTranscript) {
    response.status(400).json({ message: 'Informe a aula e a transcrição da sua resposta.' })
    return
  }

  const training = await Trilha.findOne({
    subQuery: false,
    where: { id: BigInt(id), empresaId: BigInt(request.auth!.empresaId!), ativa: true },
    include: [{
      model: Material,
      as: 'materiais',
      where: { empresaId: BigInt(request.auth!.empresaId!), tipo: 'VIDEO', ativo: true },
      required: true,
      include: [{ model: Video, as: 'video', required: true }],
      through: { attributes: ['ordem'] },
    }],
  })
  if (!training) {
    response.status(404).json({ message: 'Treinamento não encontrado.' })
    return
  }
  const materials = await loadTrainingMaterials(BigInt(id), BigInt(request.auth!.empresaId!))
  const material = (Number.isInteger(requestedVideoIndex) && requestedVideoIndex >= 0
    ? materials[requestedVideoIndex]
    : undefined) ?? materials.find(item => {
    const video = getVideo(item)
    return (requestedMaterialId !== '' && String(item.id) === requestedMaterialId)
      || youtubeId(video?.url) === requestedYoutubeId
      || (requestedVideoTitle !== '' && item.titulo.trim().toLocaleLowerCase() === requestedVideoTitle)
  })
  if (!material) {
    response.status(404).json({ message: 'A aula selecionada não foi encontrada neste treinamento.' })
    return
  }
  const video = getVideo(material)
  if (!video?.transcricao?.trim()) {
    response.status(422).json({ message: 'Esta aula ainda não possui uma transcrição para comparação.' })
    return
  }

  const evaluation = await avaliarConhecimento(video.transcricao, collaboratorTranscript)
  const empresaId = BigInt(request.auth!.empresaId!)
  const usuarioId = BigInt(request.auth!.sub)
  const assignmentMembership = await EmpresaUsuario.findOne({ where: { empresaId, usuarioId, status: 'ATIVO' } })
  const assignment = assignmentMembership
    ? await Atribuicao.findOne({ where: { empresaId, empresaUsuarioId: assignmentMembership.id, trilhaId: BigInt(id), status: { [Op.in]: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'] } } })
    : null
  await Avaliacao.create({
    empresaId,
    atribuicaoId: assignment?.id ?? null,
    usuarioId,
    trilhaId: BigInt(id),
    materialId: BigInt(material.id),
    pontuacao: evaluation.pontuacao,
    transcricao: collaboratorTranscript,
    resultado: evaluation,
  })
  await saveLessonProgress(BigInt(id), BigInt(material.id), empresaId, usuarioId, 'CONCLUIDO')
  response.json({ evaluation })
}))

router.post('/:id/progress', requireAuth, requireCompany, asyncHandler(async (request, response) => {
  const id = typeof request.params.id === 'string' ? request.params.id : ''
  const materialId = String(request.body?.materialId ?? '').trim()
  if (!/^\d+$/.test(id) || !/^\d+$/.test(materialId)) {
    response.status(400).json({ message: 'Treinamento ou aula inválidos.' })
    return
  }
  await saveLessonProgress(BigInt(id), BigInt(materialId), BigInt(request.auth!.empresaId!), BigInt(request.auth!.sub), 'CONCLUIDO')
  response.json({ message: 'Progresso da aula salvo.', completed: true })
}))

router.put('/:id', requireAuth, requireCompany, requireRole([...creatorRoles]), asyncHandler(async (request, response) => {
  const id = typeof request.params.id === 'string' ? request.params.id : ''
  if (!/^\d+$/.test(id)) {
    response.status(400).json({ message: 'Identificador de treinamento inválido.' })
    return
  }
  const title = String(request.body?.title ?? '').trim()
  const area = String(request.body?.area ?? '').trim()
  const description = String(request.body?.description ?? '').trim()
  const instructor = String(request.body?.instructor ?? '').trim()
  const duration = String(request.body?.duration ?? '').trim()
  const videos = Array.isArray(request.body?.videos) ? request.body.videos : []
  if (!title || !area || !description || !instructor || !duration) {
    response.status(400).json({ message: 'Informe nome, área, descrição, instrutor e carga horária.' })
    return
  }
  const empresaId = BigInt(request.auth!.empresaId!)
  const training = await Trilha.findOne({
    subQuery: false,
    where: { id: BigInt(id), empresaId, ativa: true },
    include: [{ model: Material, as: 'materiais', required: false, include: [{ model: Video, as: 'video', required: false }], through: { attributes: ['ordem'] } }],
  })
  if (!training) {
    response.status(404).json({ message: 'Treinamento não encontrado.' })
    return
  }
  const quiz = request.body?.quiz === undefined ? training.quiz : request.body?.quiz === null ? null : parseQuiz(request.body.quiz)
  if (request.body?.quiz !== undefined && request.body.quiz !== null && !quiz) {
    response.status(400).json({ message: 'Cada pergunta do quiz deve ter enunciado, de 2 a 6 opções, resposta correta e explicação.' })
    return
  }

  await sequelize.transaction(async transaction => {
    await training.update({ titulo: title, area, descricao: description, instrutor: instructor, duracao: duration, quiz }, { transaction })
    const currentMaterials = (training.get('materiais') as (Material & { Video?: Video | null })[] | undefined) ?? []
    for (const [index, rawVideo] of videos.entries()) {
      const video = rawVideo as { title: string; duration?: string; youtubeId: string; transcript?: string }
      const submittedYoutubeId = youtubeId(video.youtubeId)
      const current = currentMaterials.find(item => youtubeId(getVideo(item)?.url) === submittedYoutubeId) ?? currentMaterials[index]
      if (current) {
        await current.update({ titulo: String(video.title).trim() }, { transaction })
        const currentVideo = getVideo(current)
        if (currentVideo) {
          await currentVideo.update({ url: submittedYoutubeId, duracaoSegundos: parseDuration(video.duration), transcricao: String(video.transcript ?? '').trim() || null }, { transaction })
        }
      } else {
        const material = await Material.create({ empresaId, titulo: String(video.title).trim(), descricao: null, tipo: 'VIDEO', versao: 1, ativo: true }, { transaction })
        await Video.create({ materialId: material.id, url: submittedYoutubeId, duracaoSegundos: parseDuration(video.duration), transcricao: String(video.transcript ?? '').trim() || null }, { transaction })
        await TrilhaMaterial.create({ empresaId, trilhaId: training.id, materialId: material.id, ordem: index + 1, obrigatorio: true }, { transaction })
      }
    }
  })

  const saved = await Trilha.findOne({
    subQuery: false,
    where: { id: BigInt(id), empresaId },
    include: [{ model: Material, as: 'materiais', required: false, include: [{ model: Video, as: 'video', required: false }], through: { attributes: ['ordem'] } }],
  })
  response.json({ training: saved ? await serializeTraining(saved, empresaId, BigInt(request.auth!.sub)) : null })
}))

function parseDuration(value: unknown) {
  const parts = String(value ?? '').split(':').map(Number)
  if (parts.some(Number.isNaN) || parts.length < 1 || parts.length > 2) return null
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0]
}

export default router
