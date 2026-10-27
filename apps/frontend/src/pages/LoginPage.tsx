import { useState, type FormEvent } from 'react'
import { AuthShell, FieldError } from '../components/AuthShell'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { navigate } from '../router'

type Errors = {
  email?: string
  senha?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next: Errors = {}
    const emailLimpo = email.trim()

    if (!emailLimpo) {
      next.email = 'Informe seu e-mail.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      next.email = 'Informe um e-mail válido.'
    }

    if (!senha) {
      next.senha = 'Informe sua senha.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const destination = await login(email.trim(), senha)
      navigate(destination === 'dashboard' ? '/dashboard' : '/select-company')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Acesse sua conta"
      title={<>Bem-vindo de <em>volta.</em></>}
      description="Entre com seu e-mail e senha para continuar sua jornada de desenvolvimento."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <label className="field">
          <span>E-mail</span>
          <input
            className={errors.email ? 'input invalid' : 'input'}
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="seu.email@empresa.com"
            autoComplete="email"
            disabled={submitting}
          />
          <FieldError>{errors.email}</FieldError>
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            className={errors.senha ? 'input invalid' : 'input'}
            type="password"
            value={senha}
            onChange={event => setSenha(event.target.value)}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            disabled={submitting}
          />
          <FieldError>{errors.senha}</FieldError>
        </label>

        <div className="auth-form-row">
          <span className="auth-hint">Acesso seguro e criptografado</span>
          <button type="button" className="auth-link" onClick={() => navigate('/forgot-password')}>
            Esqueci minha senha
          </button>
        </div>

        <button type="submit" className="primary auth-submit" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
          {!submitting && <span>→</span>}
        </button>
      </form>
    </AuthShell>
  )
}
