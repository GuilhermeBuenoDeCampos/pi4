import { Router } from 'express'
import { FichaTecnica, Material, Pop } from '../models/index.js'
import { requireAuth, requireCompany, requireRole } from '../auth/middleware.js'
import { asyncHandler } from '../utils/async-handler.js'
import { gerarMip, gerarPop } from '../services/avaliacaoIA.js'

const router = Router()

router.post('/generate-pop', requireAuth, requireCompany, requireRole(['ADMIN', 'GESTOR']), asyncHandler(async (request, response) => {
  const transcript = String(request.body?.transcricao ?? '').trim()
  if (!transcript) {
    response.status(400).json({ message: 'Informe uma transcrição para criar o POP.' })
    return
  }
  const pop = await gerarPop(transcript)
  response.json({ pop })
}))

router.post('/generate-mip', requireAuth, requireCompany, requireRole(['ADMIN', 'GESTOR']), asyncHandler(async (request, response) => {
  const transcript = String(request.body?.transcricao ?? '').trim()
  if (!transcript) {
    response.status(400).json({ message: 'Informe uma transcrição para criar o MIP.' })
    return
  }
  const mip = await gerarMip(transcript)
  response.json({ mip })
}))

router.get('/', requireAuth, requireCompany, asyncHandler(async (request, response) => {
  const materiais = await Material.findAll({
    where: { empresaId: BigInt(request.auth!.empresaId!), ativo: true },
    include: [
      { model: Pop, as: 'pop', required: false },
      { model: FichaTecnica, as: 'fichaTecnica', required: false },
    ],
    order: [['criadoEm', 'DESC']],
  })

  response.json(materiais.map(material => {
    const pop = material.get('pop') as Pop | null
    const ficha = material.get('fichaTecnica') as FichaTecnica | null
    return {
      id: String(material.id),
      titulo: material.titulo,
      descricao: material.descricao,
      tipo: material.tipo,
      versao: material.versao,
      codigo: pop?.codigo ?? ficha?.codigo ?? null,
      categoria: pop?.categoria ?? ficha?.categoria ?? null,
      rendimento: ficha?.rendimento ?? null,
      conteudo: pop?.procedimento ?? ficha?.especificacoes ?? null,
      ingredientes: ficha?.ingredientes ?? null,
      montagemPorcionamento: ficha?.montagemPorcionamento ?? null,
      conservacao: ficha?.conservacao ?? null,
      urlDocumento: pop?.urlDocumento ?? ficha?.urlDocumento ?? null,
    }
  }))
}))

router.post('/', requireAuth, requireCompany, requireRole(['ADMIN', 'GESTOR']), asyncHandler(async (request, response) => {
  const titulo = String(request.body?.titulo ?? '').trim()
  const descricao = String(request.body?.descricao ?? '').trim()
  const codigo = String(request.body?.codigo ?? '').trim()
  const categoria = String(request.body?.categoria ?? '').trim()
  const rendimento = String(request.body?.rendimento ?? '').trim()
  const conteudo = String(request.body?.conteudo ?? '').trim()
  const ingredientes = String(request.body?.ingredientes ?? '').trim()
  const montagemPorcionamento = String(request.body?.montagemPorcionamento ?? '').trim()
  const conservacao = String(request.body?.conservacao ?? '').trim()
  const urlDocumento = String(request.body?.urlDocumento ?? '').trim()
  const tipo = String(request.body?.tipo ?? '').toUpperCase()
  const empresaId = BigInt(request.auth!.empresaId!)

  if (!titulo || !codigo || !categoria || !conteudo || !['POP', 'MIP', 'FICHA_TECNICA'].includes(tipo)) {
    response.status(400).json({ message: 'Informe título, código, categoria, conteúdo e um tipo válido.' })
    return
  }
  if (urlDocumento && !/^https?:\/\//i.test(urlDocumento)) {
    response.status(400).json({ message: 'O link do documento deve começar com http:// ou https://.' })
    return
  }

  const material = await Material.create({
    empresaId,
    titulo,
    descricao: descricao || null,
    tipo: tipo as 'POP' | 'MIP' | 'FICHA_TECNICA',
    versao: 1,
    ativo: true,
  })

  if (tipo === 'POP' || tipo === 'MIP') {
    await Pop.create({ materialId: material.id, codigo, categoria, procedimento: conteudo, urlDocumento: urlDocumento || null })
  } else {
    await FichaTecnica.create({
      materialId: material.id,
      codigo,
      categoria,
      rendimento: rendimento || null,
      especificacoes: conteudo,
      ingredientes: ingredientes || null,
      montagemPorcionamento: montagemPorcionamento || null,
      conservacao: conservacao || null,
      urlDocumento: urlDocumento || null,
    })
  }

  response.status(201).json({
    message: `${tipo === 'POP' ? 'POP' : tipo === 'MIP' ? 'MIP' : 'Ficha técnica'} criado com sucesso.`,
    material: {
      id: String(material.id),
      titulo,
      descricao: descricao || null,
      tipo,
      versao: 1,
      codigo,
      categoria,
      rendimento: tipo === 'FICHA_TECNICA' ? rendimento || null : null,
      conteudo,
      ingredientes: tipo === 'FICHA_TECNICA' ? ingredientes || null : null,
      montagemPorcionamento: tipo === 'FICHA_TECNICA' ? montagemPorcionamento || null : null,
      conservacao: tipo === 'FICHA_TECNICA' ? conservacao || null : null,
      urlDocumento: urlDocumento || null,
    },
  })
}))

router.put('/:id', requireAuth, requireCompany, requireRole(['ADMIN', 'GESTOR']), asyncHandler(async (request, response) => {
  const materialId = typeof request.params.id === 'string' ? request.params.id : ''
  if (!/^\d+$/.test(materialId)) {
    response.status(400).json({ message: 'Identificador de material inválido.' })
    return
  }
  const material = await Material.findOne({
    where: { id: BigInt(materialId), empresaId: BigInt(request.auth!.empresaId!), ativo: true },
    include: [
      { model: Pop, as: 'pop', required: false },
      { model: FichaTecnica, as: 'fichaTecnica', required: false },
    ],
  })
  if (!material) {
    response.status(404).json({ message: 'Material não encontrado.' })
    return
  }

  const titulo = String(request.body?.titulo ?? '').trim()
  const descricao = String(request.body?.descricao ?? '').trim()
  const codigo = String(request.body?.codigo ?? '').trim()
  const categoria = String(request.body?.categoria ?? '').trim()
  const rendimento = String(request.body?.rendimento ?? '').trim()
  const conteudo = String(request.body?.conteudo ?? '').trim()
  const ingredientes = String(request.body?.ingredientes ?? '').trim()
  const montagemPorcionamento = String(request.body?.montagemPorcionamento ?? '').trim()
  const conservacao = String(request.body?.conservacao ?? '').trim()
  const urlDocumento = String(request.body?.urlDocumento ?? '').trim()
  if (!titulo || !codigo || !categoria || !conteudo) {
    response.status(400).json({ message: 'Informe título, código, categoria e conteúdo.' })
    return
  }
  if (urlDocumento && !/^https?:\/\//i.test(urlDocumento)) {
    response.status(400).json({ message: 'O link do documento deve começar com http:// ou https://.' })
    return
  }

  await material.update({ titulo, descricao: descricao || null, versao: material.versao + 1 })
  if (material.tipo === 'POP' || material.tipo === 'MIP') {
    const pop = material.get('pop') as Pop | null
    if (!pop) {
      response.status(500).json({ message: 'O POP deste material não foi encontrado.' })
      return
    }
    await pop.update({ codigo, categoria, procedimento: conteudo, urlDocumento: urlDocumento || null })
  } else {
    const ficha = material.get('fichaTecnica') as FichaTecnica | null
    if (!ficha) {
      response.status(500).json({ message: 'A ficha técnica deste material não foi encontrada.' })
      return
    }
    await ficha.update({
      codigo,
      categoria,
      rendimento: rendimento || null,
      especificacoes: conteudo,
      ingredientes: ingredientes || null,
      montagemPorcionamento: montagemPorcionamento || null,
      conservacao: conservacao || null,
      urlDocumento: urlDocumento || null,
    })
  }

  response.json({
    message: `${material.tipo === 'POP' ? 'POP' : material.tipo === 'MIP' ? 'MIP' : 'Ficha técnica'} atualizado com sucesso.`,
    material: {
      id: String(material.id), titulo, descricao: descricao || null, tipo: material.tipo,
      versao: material.versao, codigo, categoria,
      rendimento: material.tipo === 'FICHA_TECNICA' ? rendimento || null : null,
      conteudo,
      ingredientes: material.tipo === 'FICHA_TECNICA' ? ingredientes || null : null,
      montagemPorcionamento: material.tipo === 'FICHA_TECNICA' ? montagemPorcionamento || null : null,
      conservacao: material.tipo === 'FICHA_TECNICA' ? conservacao || null : null,
      urlDocumento: urlDocumento || null,
    },
  })
}))

export default router
