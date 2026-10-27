import { useState, type FormEvent } from 'react'
import { AuthShell, FieldError } from '../components/AuthShell'
import { api, ApiError } from '../lib/api'
import { navigate } from '../router'

type Errors = {
  token?: string
  senha?: string
  confirmacao?: string
}

type Response = {
  message: string
}

export function ResetPasswordPage() {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Response | null>(null)

  function validate() {
    const next: Errors = {}
    if (!token.trim()) next.token = 'Informe o código de redefinição.'
    if (senha.length < 8) next.senha = 'A senha deve ter no mínimo 8 caracteres.'
    if (senha !== confirmacao) next.confirmacao = 'As senhas não conferem.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const data = await api.post<Response>('/api/auth/reset-password', { token: token.trim(), senha })
      setResult(data)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível redefinir sua senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Nova senha"
      title={<>Crie sua nova <em>senha.</em></>}
      description="Defina uma senha segura com no mínimo 8 caracteres para voltar a acessar a plataforma."
    >
      {result ? (
        <div className="auth-result">
          <div className="info-banner">
            <span>✓</span>
            <div>
              <strong>Senha redefinida</strong>
              <p>{result.message}</p>
            </div>
          </div>
          <button type="button" className="primary auth-submit" onClick={() => navigate('/login')}>
            Ir para o login <span>→</span>
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError && <div className="form-alert" role="alert">{formError}</div>}

          <label className="field">
            <span>Código de redefinição</span>
            <input
              className={errors.token ? 'input invalid' : 'input'}
              type="text"
              value={token}
              onChange={event => setToken(event.target.value)}
              placeholder="Cole aqui o código recebido"
              autoComplete="one-time-code"
              disabled={submitting}
            />
            <FieldError>{errors.token}</FieldError>
          </label>

          <label className="field">
            <span>Nova senha</span>
            <input
              className={errors.senha ? 'input invalid' : 'input'}
              type="password"
              value={senha}
              onChange={event => setSenha(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              disabled={submitting}
            />
            <FieldError>{errors.senha}</FieldError>
          </label>

          <label className="field">
            <span>Confirmar nova senha</span>
            <input
              className={errors.confirmacao ? 'input invalid' : 'input'}
              type="password"
              value={confirmacao}
              onChange={event => setConfirmacao(event.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              disabled={submitting}
            />
            <FieldError>{errors.confirmacao}</FieldError>
          </label>

          <button type="submit" className="primary auth-submit" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Redefinir senha'}
            {!submitting && <span>→</span>}
          </button>

          <button type="button" className="auth-link auth-back" onClick={() => navigate('/login')}>
            ← Voltar para o login
          </button>
        </form>
      )}
    </AuthShell>
  )
}
