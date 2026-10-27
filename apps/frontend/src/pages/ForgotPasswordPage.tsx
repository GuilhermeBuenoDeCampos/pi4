import { useState, type FormEvent } from 'react'
import { AuthShell, FieldError } from '../components/AuthShell'
import { api, ApiError } from '../lib/api'
import { navigate } from '../router'

type Response = {
  message: string
  devToken?: string
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Response | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const emailLimpo = email.trim()
    if (!emailLimpo) {
      setError('Informe seu e-mail.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setError('Informe um e-mail válido.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const data = await api.post<Response>('/api/auth/forgot-password', { email: emailLimpo })
      setResult(data)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível enviar as instruções.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Recuperação de acesso"
      title={<>Esqueceu sua <em>senha?</em></>}
      description="Informe o e-mail cadastrado e enviaremos as instruções para criar uma nova senha."
    >
      {result ? (
        <div className="auth-result">
          <div className="info-banner">
            <span>i</span>
            <div>
              <strong>Verifique seu e-mail</strong>
              <p>{result.message}</p>
            </div>
          </div>

          {result.devToken && (
            <div className="dev-token">
              <strong>Ambiente de desenvolvimento</strong>
              <p>Use o código abaixo para redefinir sua senha.</p>
              <code>{result.devToken}</code>
              <button
                type="button"
                className="secondary"
                onClick={() => navigate(`/reset-password?token=${encodeURIComponent(result.devToken!)}`)}
              >
                Redefinir agora
              </button>
            </div>
          )}

          <button type="button" className="primary auth-submit" onClick={() => navigate('/login')}>
            Voltar para o login <span>→</span>
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError && <div className="form-alert" role="alert">{formError}</div>}

          <label className="field">
            <span>E-mail cadastrado</span>
            <input
              className={error ? 'input invalid' : 'input'}
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="seu.email@empresa.com"
              autoComplete="email"
              disabled={submitting}
            />
            <FieldError>{error}</FieldError>
          </label>

          <button type="submit" className="primary auth-submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar instruções'}
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
