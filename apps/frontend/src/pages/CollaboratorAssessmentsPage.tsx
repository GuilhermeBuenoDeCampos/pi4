import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, ApiError } from '../lib/api'

type AssessmentAttempt = {
  id: string
  courseId: string | null
  courseTitle: string
  score: number
  correct: number
  total: number
  passed: boolean
  submittedAt: string
}

type PracticalStatus = 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICA'

type PracticalItem = {
  descricao: string
  status: PracticalStatus
  observacao: string
}

type PracticalAssessment = {
  id: string
  courseId: string | null
  courseTitle: string
  score: number
  passed: boolean
  items: PracticalItem[]
  observacoes: string | null
  avaliador: string | null
  submittedAt: string
}

type PracticalItemDraft = {
  key: string
  descricao: string
  status: PracticalStatus | ''
  observacao: string
  previousStatus?: PracticalStatus
}

type CollaboratorAssessment = {
  id: string
  usuarioId: string
  nome: string
  email: string
  fotoUrl: string | null
  cargo: string | null
  papel: string
  status: string
  totalAvaliacoes: number
  media: number | null
  aprovadas: number
  ultimaAvaliacao: AssessmentAttempt | null
  avaliacoes: AssessmentAttempt[]
  totalPraticas: number
  aprovadasPraticas: number
  praticas: PracticalAssessment[]
}

type TrainingOption = { id: string; title: string }
type ActivityOption = { id: string | null; title: string }
type ChecklistTemplate = { id: string; title: string; items: string[] }

const practicalStatusLabel: Record<PracticalStatus, string> = {
  CONFORME: 'Conforme',
  NAO_CONFORME: 'Não conforme',
  NAO_APLICA: 'Não se aplica',
}

const practicalStatusClass: Record<PracticalStatus, string> = {
  CONFORME: 'conforme',
  NAO_CONFORME: 'nao-conforme',
  NAO_APLICA: 'nao-aplica',
}

const genericChecklist = [
  'Demonstra domínio dos conhecimentos do treinamento',
  'Executa a atividade seguindo o procedimento padrão',
  'Utiliza os materiais e equipamentos corretamente',
  'Mantém organização e segurança durante a execução',
  'Cumpre os requisitos de qualidade da atividade',
]

const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'boas-praticas-cozinha',
    title: 'Boas Práticas na Cozinha',
    items: [
      'Higieniza as mãos antes de iniciar a atividade',
      'Utiliza uniforme e EPIs limpos e adequados',
      'Mantém a bancada organizada e higienizada',
      'Evita contaminação cruzada entre alimentos',
      'Armazena ingredientes com identificação e validade',
      'Descarta resíduos nos locais apropriados',
    ],
  },
  {
    id: 'atendimento-balcao',
    title: 'Atendimento no Balcão',
    items: [
      'Cumprimenta o cliente de forma cordial e acolhedora',
      'Aplica o roteiro padrão de atendimento',
      'Confirma o pedido antes de finalizar',
      'Trata reclamações com escuta ativa e solução',
      'Finaliza o atendimento agradecendo o cliente',
    ],
  },
  {
    id: 'higienizacao-utensilios',
    title: 'Higienização de Utensílios',
    items: [
      'Remove resíduos antes da lavagem',
      'Utiliza produtos nas diluições corretas',
      'Realiza as etapas de limpeza e desinfecção',
      'Respeita o tempo de contato dos produtos',
      'Armazena utensílios em local limpo e protegido',
    ],
  },
  {
    id: 'seguranca-alimentar',
    title: 'Segurança Alimentar',
    items: [
      'Verifica as temperaturas de armazenamento',
      'Respeita as zonas de risco de temperatura',
      'Confere rótulos e prazos de validade',
      'Separa alimentos crus dos prontos para consumo',
      'Registra os controles realizados',
    ],
  },
]

let practicalKeySeed = 0

function nextKey() {
  practicalKeySeed += 1
  return `practical-item-${practicalKeySeed}`
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function checklistFor(courseId: string | null | undefined, title: string) {
  const byId = courseId ? checklistTemplates.find(template => template.id === courseId) : undefined
  if (byId) return byId.items
  const normalizedTitle = normalizeText(title)
  return checklistTemplates.find(template => normalizeText(template.title) === normalizedTitle)?.items ?? genericChecklist
}

function createDraftItems(items: string[]): PracticalItemDraft[] {
  return items.map(descricao => ({ key: nextKey(), descricao, status: '', observacao: '' }))
}

function buildActivityOptions(collaborator: CollaboratorAssessment, trainings: TrainingOption[]) {
  const options = new Map<string, ActivityOption>()
  const add = (id: string | null, title: string) => {
    const key = normalizeText(title)
    if (!key || options.has(key)) return
    options.set(key, { id, title })
  }
  trainings.forEach(training => add(training.id, training.title))
  collaborator.avaliacoes.forEach(attempt => add(attempt.courseId, attempt.courseTitle))
  collaborator.praticas.forEach(practical => add(practical.courseId, practical.courseTitle))
  return [...options.values()]
}

function latestEvaluation(collaborator: CollaboratorAssessment) {
  const quiz = collaborator.ultimaAvaliacao
  const practical = collaborator.praticas[0] ?? null
  if (!quiz) return practical
  if (!practical) return quiz
  return new Date(quiz.submittedAt).getTime() >= new Date(practical.submittedAt).getTime() ? quiz : practical
}

function practicalCourseKey(practical: PracticalAssessment) {
  return `title:${normalizeText(practical.courseTitle)}`
}

function practicalMetaMap(praticas: PracticalAssessment[]) {
  const groups = new Map<string, PracticalAssessment[]>()
  for (const practical of praticas) {
    const key = practicalCourseKey(practical)
    groups.set(key, [...(groups.get(key) ?? []), practical])
  }

  const meta = new Map<string, { previous: PracticalAssessment | null; attemptNumber: number; delta: number | null }>()
  for (const group of groups.values()) {
    group.forEach((practical, index) => {
      const previous = group[index + 1] ?? null
      meta.set(practical.id, {
        previous,
        attemptNumber: group.length - index,
        delta: previous ? practical.score - previous.score : null,
      })
    })
  }
  return meta
}

function deltaClass(delta: number) {
  return delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'
}

function deltaLabel(delta: number) {
  if (delta > 0) return `▲ +${delta} p.p.`
  if (delta < 0) return `▼ ${delta} p.p.`
  return '= 0 p.p.'
}

function needsReevaluation(collaborator: CollaboratorAssessment) {
  const latest = latestEvaluation(collaborator)
  return latest !== null && !latest.passed
}

function findLatestPractical(collaborator: CollaboratorAssessment, courseId: string | null, title: string) {
  return collaborator.praticas.find(practical => {
    const sameId = courseId && practical.courseId ? practical.courseId === courseId : false
    return sameId || normalizeText(practical.courseTitle) === normalizeText(title)
  }) ?? null
}

function createReevaluationItems(practical: PracticalAssessment): PracticalItemDraft[] {
  return practical.items.map(item => ({
    key: nextKey(),
    descricao: item.descricao,
    status: item.status,
    observacao: item.observacao,
    previousStatus: item.status,
  }))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

export function CollaboratorAssessmentsPage({ notify }: { notify: (message: string) => void }) {
  const [collaborators, setCollaborators] = useState<CollaboratorAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [onlyDeveloping, setOnlyDeveloping] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedPracticalId, setExpandedPracticalId] = useState<string | null>(null)
  const [practicalTarget, setPracticalTarget] = useState<CollaboratorAssessment | null>(null)
  const [practicalTrainings, setPracticalTrainings] = useState<TrainingOption[]>([])
  const [loadingPracticalTrainings, setLoadingPracticalTrainings] = useState(false)
  const [practicalSource, setPracticalSource] = useState<PracticalAssessment | null>(null)
  const [practicalReevaluation, setPracticalReevaluation] = useState(false)
  const [practicalCourseId, setPracticalCourseId] = useState<string | null>(null)
  const [practicalTitle, setPracticalTitle] = useState('')
  const [practicalItems, setPracticalItems] = useState<PracticalItemDraft[]>([])
  const [practicalObservations, setPracticalObservations] = useState('')
  const [practicalError, setPracticalError] = useState('')
  const [savingPractical, setSavingPractical] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.get<CollaboratorAssessment[]>('/api/assessments/collaborators')
      setCollaborators(data)
    } catch (loadError) {
      const message = loadError instanceof ApiError ? loadError.message : 'Não foi possível carregar as avaliações dos colaboradores.'
      setError(message)
      notify(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const evaluated = collaborators.filter(collaborator => collaborator.totalAvaliacoes > 0 || collaborator.totalPraticas > 0)
  const developing = evaluated.filter(needsReevaluation)
  const approved = evaluated.filter(collaborator => latestEvaluation(collaborator)?.passed).length
  const practicalTotal = collaborators.reduce((sum, collaborator) => sum + collaborator.totalPraticas, 0)
  const practicalReevaluations = collaborators.reduce((sum, collaborator) => {
    const groups = new Map<string, number>()
    collaborator.praticas.forEach(practical => {
      const key = practicalCourseKey(practical)
      groups.set(key, (groups.get(key) ?? 0) + 1)
    })
    return sum + [...groups.values()].reduce((total, count) => total + Math.max(0, count - 1), 0)
  }, 0)

  const visible = collaborators.filter(collaborator => {
    if (onlyDeveloping && !needsReevaluation(collaborator)) return false
    const term = search.trim().toLowerCase()
    if (!term) return true
    return collaborator.nome.toLowerCase().includes(term)
      || collaborator.email.toLowerCase().includes(term)
      || (collaborator.cargo ?? '').toLowerCase().includes(term)
  })

  const applicableItems = practicalItems.filter(item => item.status === 'CONFORME' || item.status === 'NAO_CONFORME')
  const conformingItems = practicalItems.filter(item => item.status === 'CONFORME')
  const practicalScore = applicableItems.length ? Math.round((conformingItems.length / applicableItems.length) * 100) : 0
  const practicalPassed = applicableItems.length > 0 && practicalScore >= 70
  const revaluationDelta = practicalSource ? practicalScore - practicalSource.score : null
  const activityOptions = practicalTarget ? buildActivityOptions(practicalTarget, practicalTrainings) : []

  async function openPractical(collaborator: CollaboratorAssessment, source: PracticalAssessment | null = null, reevaluation = source !== null) {
    setLoadingPracticalTrainings(true)
    try {
      const assignedTrainings = await api.get<TrainingOption[]>(`/api/assessments/collaborators/${collaborator.usuarioId}/trainings`)
      const options = buildActivityOptions(collaborator, assignedTrainings)
      const latest = latestEvaluation(collaborator)
      const preferred = source
        ? options.find(option => normalizeText(option.title) === normalizeText(source.courseTitle))
        : latest
          ? options.find(option => normalizeText(option.title) === normalizeText(latest.courseTitle))
          : undefined
      const option = preferred ?? options[0]
      setPracticalTrainings(assignedTrainings)
      setPracticalTarget(collaborator)
      setPracticalSource(source)
      setPracticalReevaluation(reevaluation || source !== null)
      setPracticalCourseId(source?.courseId ?? option?.id ?? null)
      setPracticalTitle(source?.courseTitle ?? option?.title ?? '')
      setPracticalItems(source
        ? createReevaluationItems(source)
        : createDraftItems(checklistFor(option?.id ?? null, option?.title ?? '')))
      setPracticalObservations('')
      setPracticalError(options.length === 0 ? 'Este colaborador não possui treinamentos atribuídos para avaliação.' : '')
      setSavingPractical(false)
    } catch (loadError) {
      const message = loadError instanceof ApiError ? loadError.message : 'Não foi possível carregar os treinamentos deste colaborador.'
      notify(message)
    } finally {
      setLoadingPracticalTrainings(false)
    }
  }

  function openReevaluation(collaborator: CollaboratorAssessment) {
    const latest = latestEvaluation(collaborator)
    const source = latest ? findLatestPractical(collaborator, latest.courseId, latest.courseTitle) : null
    openPractical(collaborator, source, true)
  }

  function closePractical() {
    if (savingPractical) return
    setPracticalTarget(null)
    setPracticalSource(null)
    setPracticalReevaluation(false)
    setPracticalError('')
  }

  function changePracticalActivity(title: string) {
    if (!practicalTarget) return
    const option = buildActivityOptions(practicalTarget, practicalTrainings).find(item => item.title === title)
    const source = findLatestPractical(practicalTarget, option?.id ?? null, title)
    setPracticalSource(source)
    setPracticalReevaluation(current => current || source !== null)
    setPracticalCourseId(option?.id ?? null)
    setPracticalTitle(title)
    setPracticalItems(source
      ? createReevaluationItems(source)
      : createDraftItems(checklistFor(option?.id ?? null, title)))
    setPracticalObservations('')
    setPracticalError('')
  }

  function updatePracticalItem(key: string, patch: Partial<PracticalItemDraft>) {
    setPracticalItems(current => current.map(item => item.key === key ? { ...item, ...patch } : item))
  }

  function addPracticalItem() {
    setPracticalItems(current => [...current, { key: nextKey(), descricao: '', status: '', observacao: '' }])
  }

  function removePracticalItem(key: string) {
    setPracticalItems(current => current.filter(item => item.key !== key))
  }

  async function submitPractical() {
    if (!practicalTarget) return
    setPracticalError('')
    if (!practicalTitle.trim()) {
      setPracticalError('Informe a atividade avaliada.')
      return
    }
    if (practicalItems.length === 0) {
      setPracticalError('Adicione pelo menos um critério ao checklist.')
      return
    }
    if (practicalItems.some(item => !item.descricao.trim())) {
      setPracticalError('Preencha a descrição de todos os critérios do checklist.')
      return
    }
    if (practicalItems.some(item => !item.status)) {
      setPracticalError('Classifique todos os critérios como conforme, não conforme ou não se aplica.')
      return
    }
    if (applicableItems.length === 0) {
      setPracticalError('Marque pelo menos um critério como conforme ou não conforme.')
      return
    }

    setSavingPractical(true)
    const wasReevaluation = practicalReevaluation
    try {
      await api.post('/api/assessments/practical', {
        usuarioId: practicalTarget.usuarioId,
        courseId: practicalCourseId,
        courseTitle: practicalTitle.trim(),
        items: practicalItems.map(item => ({
          descricao: item.descricao.trim(),
          status: item.status as PracticalStatus,
          observacao: item.observacao.trim(),
        })),
        observacoes: practicalObservations.trim(),
      })
      setPracticalTarget(null)
      setPracticalSource(null)
      setPracticalReevaluation(false)
      notify(wasReevaluation ? 'Reavaliação registrada com sucesso.' : 'Avaliação prática registrada com sucesso.')
      await load()
    } catch (submitError) {
      const message = submitError instanceof ApiError ? submitError.message : 'Não foi possível registrar a avaliação prática.'
      setPracticalError(message)
    } finally {
      setSavingPractical(false)
    }
  }

  return <div className="team-assessments-page">
    <div className="page-intro">
      <div>
        <p className="eyebrow">Gestão de desempenho</p>
        <h2>Avaliação dos colaboradores</h2>
        <p>Acompanhe as notas, avalie a prática com checklist e conduza reavaliações para acompanhar o desenvolvimento da equipe.</p>
      </div>
      <button className="secondary" type="button" onClick={load} disabled={loading}>{loading ? 'Atualizando...' : 'Atualizar'}</button>
    </div>

    {error && <div className="form-alert" role="alert">{error}</div>}

    <div className="metric-grid">
      <article className="metric-card"><span className="metric-icon">☷</span><p>Colaboradores</p><strong>{collaborators.length}</strong><small>Pessoas vinculadas à empresa</small></article>
      <article className="metric-card"><span className="metric-icon">✓</span><p>Avaliados</p><strong>{evaluated.length}</strong><small>Já realizaram quiz ou prática</small></article>
      <article className="metric-card"><span className="metric-icon">↗</span><p>Aprovados</p><strong>{approved}</strong><small>Aprovação na avaliação mais recente</small></article>
      <article className="metric-card"><span className="metric-icon">★</span><p>Avaliações práticas</p><strong>{practicalTotal}</strong><small>{practicalReevaluations} reavaliação{practicalReevaluations === 1 ? '' : 'ões'} registrada{practicalReevaluations === 1 ? '' : 's'}</small></article>
    </div>

    <section className="panel team-assessments-panel">
      <div className="team-assessments-toolbar">
        <div>
          <p className="eyebrow">Resultados da equipe</p>
          <h3>Avaliações por colaborador</h3>
        </div>
        <div className="team-assessments-tools">
          <button
            className={`small-button ${onlyDeveloping ? '' : 'ghost'}`}
            type="button"
            onClick={() => setOnlyDeveloping(current => !current)}
            aria-pressed={onlyDeveloping}
          >
            Em desenvolvimento ({developing.length})
          </button>
          <input
            className="input assessment-search"
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail ou cargo"
            aria-label="Buscar colaborador"
          />
        </div>
      </div>

      {loading
        ? <div className="material-empty">Carregando avaliações...</div>
        : visible.length === 0
          ? <div className="material-empty">{collaborators.length === 0 ? 'Nenhum colaborador vinculado à empresa.' : onlyDeveloping ? 'Nenhum colaborador em desenvolvimento no momento.' : 'Nenhum colaborador encontrado para a busca.'}</div>
          : <div className="team-assessment-table">
            <div className="team-assessment-row team-assessment-head">
              <span>Colaborador</span>
              <span>Cargo</span>
              <span>Avaliações</span>
              <span>Média</span>
              <span>Última nota</span>
              <span>Status</span>
              <span />
            </div>
            {visible.map(collaborator => {
              const expanded = expandedId === collaborator.id
              const latest = latestEvaluation(collaborator)
              const latestIsPractical = latest ? 'items' in latest : false
              const hasEvaluations = collaborator.totalAvaliacoes > 0 || collaborator.totalPraticas > 0
              const practicalMeta = practicalMetaMap(collaborator.praticas)
              const latestPractical = collaborator.praticas[0] ?? null
              const latestPracticalMeta = latestPractical ? practicalMeta.get(latestPractical.id) ?? null : null
              const latestNeedsReevaluation = latest !== null && !latest.passed
              return <div className="team-assessment-group" key={collaborator.id}>
                <div className="team-assessment-row">
                  <div className="team-assessment-person">
                    <span className="avatar collaborator-avatar">{collaborator.fotoUrl ? <img className="avatar-image" src={collaborator.fotoUrl} alt="" /> : initials(collaborator.nome)}</span>
                    <div><strong>{collaborator.nome}</strong><small>{collaborator.email}</small></div>
                  </div>
                  <span className="muted">{collaborator.cargo || 'Não informado'}</span>
                  <div className="team-assessment-counts"><span>{collaborator.totalAvaliacoes} quiz</span><span>{collaborator.totalPraticas} prática{collaborator.totalPraticas === 1 ? '' : 's'}</span></div>
                  <strong>{collaborator.media === null ? '—' : `${collaborator.media}%`}</strong>
                  <div>{latest ? <><strong>{latest.score}%</strong><small>{latest.courseTitle} · {latestIsPractical ? 'Prática' : 'Quiz'}</small>{latestIsPractical && latestPracticalMeta !== null && latestPracticalMeta.delta !== null && <small className={`team-assessment-evolution ${deltaClass(latestPracticalMeta.delta)}`}>{deltaLabel(latestPracticalMeta.delta)} vs. anterior</small>}</> : <span className="muted">Sem avaliação</span>}</div>
                  <span className={latest ? (latest.passed ? 'status aprovado' : 'status reprovado') : 'status pendente'}>{latest ? (latest.passed ? 'Aprovado' : 'Reprovado') : 'Pendente'}</span>
                  <div className="team-assessment-actions">
                    <button className="small-button ghost" type="button" onClick={() => setExpandedId(expanded ? null : collaborator.id)} disabled={!hasEvaluations}>{expanded ? 'Ocultar' : 'Ver detalhes'}</button>
                    {latestNeedsReevaluation
                      ? <button className="small-button" type="button" onClick={() => openReevaluation(collaborator)} disabled={loadingPracticalTrainings}>Reavaliar</button>
                      : <button className="small-button" type="button" onClick={() => openPractical(collaborator)} disabled={loadingPracticalTrainings}>Avaliar prática</button>}
                  </div>
                </div>
                {expanded && <div className="team-assessment-detail">
                  <div className="team-assessment-history-head">
                    <strong>Avaliações teóricas</strong>
                    <span>{collaborator.aprovadas} de {collaborator.totalAvaliacoes} aprovadas</span>
                  </div>
                  {collaborator.avaliacoes.length === 0
                    ? <p className="team-assessment-empty">Este colaborador ainda não realizou nenhum quiz.</p>
                    : <div className="team-assessment-history">
                      {collaborator.avaliacoes.map(attempt => <div className="team-assessment-history-row" key={attempt.id}>
                        <div><strong>{attempt.courseTitle}</strong><small>{formatDate(attempt.submittedAt)}</small></div>
                        <span>{attempt.correct} de {attempt.total} acertos</span>
                        <strong>{attempt.score}%</strong>
                        <span className={attempt.passed ? 'status aprovado' : 'status reprovado'}>{attempt.passed ? 'Aprovado' : 'Reprovado'}</span>
                      </div>)}
                    </div>}

                  <div className="team-assessment-history-head">
                    <strong>Avaliações práticas</strong>
                    <span>{collaborator.aprovadasPraticas} de {collaborator.totalPraticas} aprovadas</span>
                  </div>
                  {collaborator.praticas.length === 0
                    ? <p className="team-assessment-empty">Nenhuma avaliação prática registrada. Use o botão "Avaliar prática" para começar.</p>
                    : <div className="practical-history">
                      {collaborator.praticas.map(practical => {
                        const meta = practicalMeta.get(practical.id)
                        return <article className="practical-history-card" key={practical.id}>
                          <div className="practical-history-head">
                            <div className="practical-history-title">
                              <strong>{practical.courseTitle}</strong>
                              <small>{formatDate(practical.submittedAt)}{practical.avaliador ? ` · Avaliado por ${practical.avaliador}` : ''}{meta && meta.attemptNumber > 1 ? ` · Reavaliação ${meta.attemptNumber}` : ''}</small>
                            </div>
                            <div className="practical-history-score">
                              <strong>{practical.score}%</strong>
                              {meta && meta.delta !== null && <span className={`practical-evolution ${deltaClass(meta.delta)}`} title={meta.previous ? `Avaliação anterior: ${meta.previous.score}% em ${formatDate(meta.previous.submittedAt)}` : undefined}>{deltaLabel(meta.delta)}</span>}
                            </div>
                            <span className={practical.passed ? 'status aprovado' : 'status reprovado'}>{practical.passed ? 'Aprovado' : 'Reprovado'}</span>
                            <div className="practical-history-actions">
                              <button className="small-button ghost" type="button" onClick={() => setExpandedPracticalId(expandedPracticalId === practical.id ? null : practical.id)}>{expandedPracticalId === practical.id ? 'Ocultar checklist' : 'Ver checklist'}</button>
                              {!practical.passed && <button className="small-button" type="button" onClick={() => openPractical(collaborator, practical, true)} disabled={loadingPracticalTrainings}>Reavaliar</button>}
                            </div>
                          </div>
                        {expandedPracticalId === practical.id && <div className="practical-history-body">
                          <div className="practical-history-items">
                            {practical.items.map((item, index) => <div className="practical-history-item" key={`${practical.id}-${index}`}>
                              <span className={`practical-history-status ${practicalStatusClass[item.status]}`}>{practicalStatusLabel[item.status]}</span>
                              <div>
                                <strong>{item.descricao}</strong>
                                {item.observacao && <p>{item.observacao}</p>}
                              </div>
                            </div>)}
                          </div>
                          {practical.observacoes && <div className="practical-history-notes"><strong>Observações gerais</strong><p>{practical.observacoes}</p></div>}
                        </div>}
                      </article>
                      })}
                    </div>}
                </div>}
              </div>
            })}
          </div>}
    </section>

    {practicalTarget && createPortal(<div className="practical-overlay" role="dialog" aria-modal="true" aria-label={`${practicalReevaluation ? 'Reavaliação' : 'Avaliação'} prática de ${practicalTarget.nome}`}>
      <div className="practical-modal">
        <div className="practical-modal-head">
          <div>
            <p className="eyebrow">{practicalReevaluation ? 'Reavaliação prática' : 'Avaliação prática'}</p>
            <h3>{practicalTarget.nome}</h3>
            <p>{practicalReevaluation
              ? practicalSource
                ? `Atualize o checklist com base na avaliação de ${formatDate(practicalSource.submittedAt)} (${practicalSource.score}%).`
                : 'Registre uma nova avaliação prática para acompanhar o desenvolvimento do colaborador.'
              : 'Marque cada critério observado e registre as evidências de desempenho.'}</p>
          </div>
          <button className="practical-close" type="button" onClick={closePractical} disabled={savingPractical} aria-label="Fechar avaliação prática">×</button>
        </div>

        {practicalError && <div className="form-alert" role="alert">{practicalError}</div>}

        <div className="practical-form">
          {practicalSource && <div className="practical-revaluation-note">
            <div>
              <strong>Reavaliação</strong>
              <p>Avaliação anterior em {formatDate(practicalSource.submittedAt)}: <b>{practicalSource.score}%</b> ({practicalSource.passed ? 'aprovado' : 'reprovado'}).</p>
            </div>
            {practicalSource.observacoes && <div className="practical-revaluation-notes">
              <strong>Observações da avaliação anterior</strong>
              <p>{practicalSource.observacoes}</p>
            </div>}
            <p className="practical-revaluation-hint">Os critérios abaixo já vêm preenchidos com o resultado anterior. Atualize conforme a evolução observada.</p>
          </div>}

          {practicalReevaluation && !practicalSource && <div className="practical-revaluation-note">
            <div>
              <strong>Reavaliação</strong>
              <p>Este colaborador ainda não possui avaliação prática registrada para esta atividade.</p>
            </div>
            <p className="practical-revaluation-hint">Registre a primeira evidência prática desta reavaliação para acompanhar o desenvolvimento.</p>
          </div>}

          <label className="field">
            <span>Atividade avaliada</span>
            <select className="input" value={practicalTitle} onChange={event => changePracticalActivity(event.target.value)} disabled={savingPractical || activityOptions.length === 0}>
              {activityOptions.length === 0
                ? <option value="">Nenhum treinamento atribuído</option>
                : activityOptions.map(option => <option key={`${option.id ?? 'custom'}-${option.title}`} value={option.title}>{option.title}</option>)}
            </select>
          </label>

          <div className="practical-checklist-head">
            <strong>Checklist de execução</strong>
            <span>{practicalItems.filter(item => item.status).length} de {practicalItems.length} critérios classificados</span>
          </div>

          <div className="practical-checklist">
            {practicalItems.map((item, index) => <div className="practical-item" key={item.key}>
              <div className="practical-item-top">
                <span className="practical-item-number">{index + 1}</span>
                <input
                  className="input practical-item-description"
                  value={item.descricao}
                  onChange={event => updatePracticalItem(item.key, { descricao: event.target.value })}
                  placeholder="Descreva o critério avaliado"
                  disabled={savingPractical}
                />
                <button className="practical-item-remove" type="button" onClick={() => removePracticalItem(item.key)} disabled={savingPractical || practicalItems.length <= 1} aria-label="Remover critério">×</button>
              </div>
              <div className="practical-item-controls">
                <div className="practical-status-group">
                  <button className={`practical-status-option ${item.status === 'CONFORME' ? 'active conforme' : ''}`} type="button" onClick={() => updatePracticalItem(item.key, { status: 'CONFORME' })} disabled={savingPractical}>Conforme</button>
                  <button className={`practical-status-option ${item.status === 'NAO_CONFORME' ? 'active nao-conforme' : ''}`} type="button" onClick={() => updatePracticalItem(item.key, { status: 'NAO_CONFORME' })} disabled={savingPractical}>Não conforme</button>
                  <button className={`practical-status-option ${item.status === 'NAO_APLICA' ? 'active nao-aplica' : ''}`} type="button" onClick={() => updatePracticalItem(item.key, { status: 'NAO_APLICA' })} disabled={savingPractical}>N/A</button>
                </div>
                <input
                  className="input practical-item-observation"
                  value={item.observacao}
                  onChange={event => updatePracticalItem(item.key, { observacao: event.target.value })}
                  placeholder="Observação / evidência (opcional)"
                  disabled={savingPractical}
                />
              </div>
              {item.previousStatus && <small className={`practical-item-previous ${item.status && item.status !== item.previousStatus ? 'changed' : ''}`}>
                Avaliação anterior: {practicalStatusLabel[item.previousStatus]}
                {item.status && item.status !== item.previousStatus ? ' · status alterado' : ''}
              </small>}
            </div>)}
          </div>

          <button className="secondary practical-add" type="button" onClick={addPracticalItem} disabled={savingPractical}>+ Adicionar critério</button>

          <label className="field">
            <span>Observações gerais</span>
            <textarea
              className="input material-textarea"
              rows={4}
              value={practicalObservations}
              onChange={event => setPracticalObservations(event.target.value)}
              placeholder="Documente dificuldades, evidências de desempenho e orientações para o colaborador."
              maxLength={4000}
              disabled={savingPractical}
            />
          </label>

          <div className="practical-summary">
            <div>
              <span>{practicalSource ? 'Resultado da reavaliação' : 'Resultado parcial'}</span>
              <strong>{practicalScore}%</strong>
              <small>{conformingItems.length} de {applicableItems.length} critérios aplicáveis conformes{practicalSource && revaluationDelta !== null ? ` · Anterior: ${practicalSource.score}% (${deltaLabel(revaluationDelta)})` : ''}</small>
            </div>
            <span className={applicableItems.length === 0 ? 'status pendente' : practicalPassed ? 'status aprovado' : 'status reprovado'}>
              {applicableItems.length === 0 ? 'Aguardando checklist' : practicalPassed ? 'Aprovado' : 'Reprovado'}
            </span>
          </div>

          <div className="practical-actions">
            <button className="secondary" type="button" onClick={closePractical} disabled={savingPractical}>Cancelar</button>
            <button className="form-submit" type="button" onClick={submitPractical} disabled={savingPractical}>{savingPractical ? 'Registrando...' : practicalReevaluation ? 'Registrar reavaliação' : 'Registrar avaliação'}</button>
          </div>
        </div>
      </div>
    </div>, document.body)}
  </div>
}
