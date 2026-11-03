import { Router } from 'express'
import { FichaTecnica, HistoricoVisualizacao, Material, Pop } from '../models/index.js'
import { requireAuth, requireCompany } from '../auth/middleware.js'
import { asyncHandler } from '../utils/async-handler.js'

const router = Router()

router.get('/views', requireAuth, requireCompany, asyncHandler(async (request, response) => {
  const history = await HistoricoVisualizacao.findAll({
    where: { usuarioId: BigInt(request.auth!.sub), empresaId: BigInt(request.auth!.empresaId!) },
    include: [{
      model: Material,
      as: 'material',
      attributes: ['id', 'titulo', 'tipo'],
      include: [
        { model: Pop, as: 'pop', attributes: ['codigo', 'categoria'], required: false },
        { model: FichaTecnica, as: 'fichaTecnica', attributes: ['codigo', 'categoria'], required: false },
      ],
    }],
    order: [['visualizadoEm', 'DESC']],
  })

  response.json(history.map(item => {
    const material = item.get('material') as Material
    const pop = material.get('pop') as Pop | null
    const ficha = material.get('fichaTecnica') as FichaTecnica | null
    return {
      id: String(item.id),
      materialId: String(material.id),
      titulo: material.titulo,
      tipo: material.tipo,
      codigo: pop?.codigo ?? ficha?.codigo ?? null,
      categoria: pop?.categoria ?? ficha?.categoria ?? null,
      versao: item.versao,
      visualizadoEm: item.visualizadoEm,
    }
  }))
}))

router.post('/views/:materialId', requireAuth, requireCompany, asyncHandler(async (request, response) => {
  const materialId = typeof request.params.materialId === 'string' ? request.params.materialId : ''
  if (!/^\d+$/.test(materialId)) {
    response.status(400).json({ message: 'Identificador de material inválido.' })
    return
  }
  const material = await Material.findOne({
    where: { id: BigInt(materialId), empresaId: BigInt(request.auth!.empresaId!), ativo: true },
    attributes: ['id', 'versao', 'tipo'],
  })
  if (!material || !['POP', 'FICHA_TECNICA'].includes(material.tipo)) {
    response.status(404).json({ message: 'Material não encontrado.' })
    return
  }
  const item = await HistoricoVisualizacao.create({
    usuarioId: BigInt(request.auth!.sub),
    empresaId: BigInt(request.auth!.empresaId!),
    materialId: material.id,
    versao: material.versao,
  })
  response.status(201).json({ id: String(item.id), versao: item.versao, visualizadoEm: item.visualizadoEm })
}))

export default router
