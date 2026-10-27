import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../lib/api'

type CollaboratorResponse = {
  message: string
  createdUser: boolean
  inviteToken?: string
  collaborator: {
    id: string
    usuarioId: string
    nome: string
    email: string
    telefone: string | null
    cargo: string | null
    papel: string
    status: string
  }
}

type Errors = {
  nome?: string
  email?: string
  telefone?: string
  papel?: string
}

const papeis = [
  { value: 'COLABORADOR', label: 'Colaborador' },
  { value: 'INSTRUTOR', label: 'Instrutor' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'ADMIN', label: 'Administrador' },
]

export function NewCollaboratorPage({ notify, onBack }: { notify: (message: string) => void; onBack: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cargo, setCargo] = useState('')
  const [papel, setPapel] = useState('COLABORADOR')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CollaboratorResponse | null>(null)

  function validate() {
    const next: Errors = {}
    if (!nome.trim()) next.nome = 'Informe o nome do colaborador.'

    const emailLimpo = email.trim()
    if (!emailLimpo) {
      next.email = 'Informe o e-mail.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      next.email = 'Informe um e-mail válido.'
    }

    if (telefone.trim() && telefone.replace(/\D/g, '').length < 10) {
      next.telefone = 'Informe um telefone válido com DDD.'
    }

    if (!papeis.some(item => item.value === papel)) next.papel = 'Selecione uma permissão.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function resetForm() {
    setNome('')
    setEmail('')
    setTelefone('')
    setCargo('')
    setPapel('COLABORADOR')
    setErrors({})
    setFormError('')
    setResult(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const data = await api.post<CollaboratorResponse>('/api/admin/collaborators', {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cargo: cargo.trim(),
        papel,
      })
      setResult(data)
      notify(data.message)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Não foi possível cadastrar o colaborador.'
      setFormError(message)
      notify(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Gestão de pessoas</p>
          <h2>Novo colaborador</h2>
          <p>Cadastre um colaborador e defina o cargo e a permissão dentro da empresa atual.</p>
        </div>
        <button type="button" className="secondary" onClick={onBack}>Voltar</button>
      </div>

      <section className="panel form-panel">
        {result ? (
          <div className="collaborator-result">
            <div className="info-banner">
              <span>✓</span>
              <div>
                <strong>{result.createdUser ? 'Colaborador criado' : 'Colaborador vinculado'}</strong>
                <p>{result.message}</p>
              </div>
            </div>

            <div className="detail-row"><span>Nome</span><strong>{result.collaborator.nome}</strong></div>
            <div className="detail-row"><span>E-mail</span><strong>{result.collaborator.email}</strong></div>
            <div className="detail-row"><span>Telefone</span><strong>{result.collaborator.telefone ?? '—'}</strong></div>
            <div className="detail-row"><span>Cargo</span><strong>{result.collaborator.cargo ?? '—'}</strong></div>
            <div className="detail-row"><span>Permissão</span><strong>{papeis.find(item => item.value === result.collaborator.papel)?.label ?? result.collaborator.papel}</strong></div>
            <div className="detail-row"><span>Status</span><strong>{result.collaborator.status === 'CONVIDADO' ? 'Convite pendente' : 'Ativo'}</strong></div>

            {result.inviteToken && (
              <div className="dev-token">
                <strong>Convite em ambiente de desenvolvimento</strong>
                <p>Como o envio de e-mail não está configurado, use o código abaixo para definir a senha.</p>
                <code>{result.inviteToken}</code>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="form-submit" onClick={resetForm}>Cadastrar outro colaborador</button>
              <button type="button" className="secondary" onClick={onBack}>Voltar ao início</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Dados do colaborador</p>
                <h3>Informações de acesso</h3>
              </div>
            </div>

            {formError && <div className="form-alert" role="alert">{formError}</div>}

            <div className="form-grid">
              <label className="field field-wide">
                <span>Nome completo</span>
                <input
                  className={errors.nome ? 'input invalid' : 'input'}
                  type="text"
                  value={nome}
                  onChange={event => setNome(event.target.value)}
                  placeholder="Ex.: Maria Oliveira"
                  autoComplete="name"
                  disabled={submitting}
                />
                {errors.nome && <small className="field-error">{errors.nome}</small>}
              </label>

              <label className="field">
                <span>E-mail</span>
                <input
                  className={errors.email ? 'input invalid' : 'input'}
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="colaborador@empresa.com"
                  autoComplete="email"
                  disabled={submitting}
                />
                {errors.email && <small className="field-error">{errors.email}</small>}
              </label>

              <label className="field">
                <span>Telefone</span>
                <input
                  className={errors.telefone ? 'input invalid' : 'input'}
                  type="tel"
                  value={telefone}
                  onChange={event => setTelefone(event.target.value)}
                  placeholder="(35) 99999-0000"
                  autoComplete="tel"
                  disabled={submitting}
                />
                {errors.telefone && <small className="field-error">{errors.telefone}</small>}
              </label>

              <label className="field">
                <span>Cargo</span>
                <input
                  className="input"
                  type="text"
                  value={cargo}
                  onChange={event => setCargo(event.target.value)}
                  placeholder="Ex.: Auxiliar de Cozinha"
                  disabled={submitting}
                />
              </label>

              <label className="field">
                <span>Permissão</span>
                <select
                  className={errors.papel ? 'input invalid' : 'input'}
                  value={papel}
                  onChange={event => setPapel(event.target.value)}
                  disabled={submitting}
                >
                  {papeis.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                {errors.papel && <small className="field-error">{errors.papel}</small>}
              </label>
            </div>

            <div className="info-banner form-note">
              <span>i</span>
              <div>
                <strong>Como funciona o convite</strong>
                <p>Se o e-mail já existir no sistema, o colaborador apenas será vinculado à empresa atual. Caso contrário, criaremos o usuário e enviaremos um e-mail para ele definir a senha.</p>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="form-submit" disabled={submitting}>
                {submitting ? 'Cadastrando...' : 'Cadastrar colaborador'}
                {!submitting && <span>→</span>}
              </button>
              <button type="button" className="secondary" onClick={onBack} disabled={submitting}>Cancelar</button>
            </div>
          </form>
        )}
      </section>
    </>
  )
}
