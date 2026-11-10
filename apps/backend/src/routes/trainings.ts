import { Router } from 'express'
import { sequelize } from '../database/sequelize.js'
import { Material, Trilha, TrilhaMaterial, Video } from '../models/index.js'
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

function serializeTraining(training: Trilha) {
  const materials = orderedMaterials(training)
  return {
    id: String(training.id),
    title: training.titulo,
    area: training.area ?? '',
    progress: 0,
    status: 'Pendente',
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
  response.json(trainings.map(serializeTraining))
}))

router.post('/', requireAuth, requireCompany, requireRole([...creatorRoles]), asyncHandler(async (request, response) => {
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
  if (videos.some((video: unknown) => !video || typeof video !== 'object' || !String((video as { title?: unknown }).title ?? '').trim() || !youtubeId((video as { youtubeId?: unknown }).youtubeId))) {
    response.status(400).json({ message: 'Cada aula deve ter título e um vídeo válido.' })
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
  response.status(201).json({ training: saved ? serializeTraining(saved) : null })
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
  response.json({ evaluation })
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

  await sequelize.transaction(async transaction => {
    await training.update({ titulo: title, area, descricao: description, instrutor: instructor, duracao: duration }, { transaction })
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
  response.json({ training: saved ? serializeTraining(saved) : null })
}))

function parseDuration(value: unknown) {
  const parts = String(value ?? '').split(':').map(Number)
  if (parts.some(Number.isNaN) || parts.length < 1 || parts.length > 2) return null
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0]
}

export default router
