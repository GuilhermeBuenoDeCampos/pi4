import { useState, type FormEvent } from 'react'
import { AuthShell, FieldError } from '../components/AuthShell'
import { ApiError, api } from '../lib/api'
import { navigate } from '../router'

type Errors = Partial<Record<'nome' | 'email' | 'telefone' | 'senha' | 'razaoSocial' | 'nomeFantasia' | 'cnpj', string>>

export function RegisterCompanyPage() {
  const [values, setValues] = useState({ nome: '', email: '', telefone: '', senha: '', razaoSocial: '', nomeFantasia: '', cnpj: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const update = (field: keyof typeof values, value: string) => setValues(current => ({ ...current, [field]: value }))

  function validate() {
    const next: Errors = {}
    if (!values.nome.trim()) next.nome = 'Informe seu nome.'
    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Informe um e-mail válido.'
    if (values.telefone && values.telefone.replace(/\D/g, '').length < 10) next.telefone = 'Informe um telefone válido com DDD.'
    if (values.senha.length < 8) next.senha = 'A senha deve ter no mínimo 8 caracteres.'
    if (!values.razaoSocial.trim()) next.razaoSocial = 'Informe a razão social.'
    if (!values.nomeFantasia.trim()) next.nomeFantasia = 'Informe o nome fantasia.'
    if (values.cnpj && values.cnpj.replace(/\D/g, '').length !== 14) next.cnpj = 'Informe um CNPJ válido com 14 dígitos.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      const data = await api.post<{ message: string }>('/api/auth/register-company', {
        ...values,
        nome: values.nome.trim(),
        email: values.email.trim(),
        razaoSocial: values.razaoSocial.trim(),
        nomeFantasia: values.nomeFantasia.trim(),
      })
      setSuccess(data.message)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível concluir o cadastro.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return <AuthShell eyebrow="Cadastro concluído" title={<>Sua empresa está <em>pronta.</em></>} description={success}>
      <div className="registration-success"><span>✓</span><p>O administrador principal foi criado com acesso à plataforma.</p><button className="primary auth-submit" onClick={() => navigate('/login')}>Ir para o login <span>→</span></button></div>
    </AuthShell>
  }

  return <AuthShell cardClassName="registration-card" eyebrow="Comece sua jornada" title={<>Cadastre sua <em>empresa.</em></>} description="Crie o acesso da sua empresa e comece a desenvolver sua equipe.">
    <form className="auth-form registration-form" onSubmit={submit} noValidate>
      {formError && <div className="form-alert" role="alert">{formError}</div>}
      <p className="form-section-label">Dados do responsável</p>
      <div className="form-grid auth-form-grid">
        <label className="field"><span>Nome completo</span><input className={errors.nome ? 'input invalid' : 'input'} value={values.nome} onChange={event => update('nome', event.target.value)} autoComplete="name" disabled={submitting} /><FieldError>{errors.nome}</FieldError></label>
        <label className="field"><span>E-mail</span><input className={errors.email ? 'input invalid' : 'input'} type="email" value={values.email} onChange={event => update('email', event.target.value)} autoComplete="email" disabled={submitting} /><FieldError>{errors.email}</FieldError></label>
        <label className="field"><span>Telefone <small>(opcional)</small></span><input className={errors.telefone ? 'input invalid' : 'input'} value={values.telefone} onChange={event => update('telefone', event.target.value)} autoComplete="tel" disabled={submitting} /><FieldError>{errors.telefone}</FieldError></label>
        <label className="field"><span>Senha</span><input className={errors.senha ? 'input invalid' : 'input'} type="password" value={values.senha} onChange={event => update('senha', event.target.value)} autoComplete="new-password" disabled={submitting} /><FieldError>{errors.senha}</FieldError></label>
      </div>
      <p className="form-section-label">Dados da empresa</p>
      <div className="form-grid auth-form-grid">
        <label className="field"><span>Razão social</span><input className={errors.razaoSocial ? 'input invalid' : 'input'} value={values.razaoSocial} onChange={event => update('razaoSocial', event.target.value)} disabled={submitting} /><FieldError>{errors.razaoSocial}</FieldError></label>
        <label className="field"><span>Nome fantasia</span><input className={errors.nomeFantasia ? 'input invalid' : 'input'} value={values.nomeFantasia} onChange={event => update('nomeFantasia', event.target.value)} disabled={submitting} /><FieldError>{errors.nomeFantasia}</FieldError></label>
        <label className="field field-wide"><span>CNPJ <small>(opcional)</small></span><input className={errors.cnpj ? 'input invalid' : 'input'} value={values.cnpj} onChange={event => update('cnpj', event.target.value)} placeholder="00.000.000/0000-00" disabled={submitting} /><FieldError>{errors.cnpj}</FieldError></label>
      </div>
      <button type="submit" className="primary auth-submit" disabled={submitting}>{submitting ? 'Cadastrando...' : 'Criar cadastro'}{!submitting && <span>→</span>}</button>
      <p className="auth-switch">Já possui uma conta? <button type="button" className="auth-link" onClick={() => navigate('/login')}>Entrar</button></p>
    </form>
  </AuthShell>
}
