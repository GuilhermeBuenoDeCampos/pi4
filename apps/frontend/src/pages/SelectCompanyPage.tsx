import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError, type ApiCompany } from '../lib/api'
import { navigate } from '../router'

const papelLabel: Record<ApiCompany['papel'], string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  INSTRUTOR: 'Instrutor',
  COLABORADOR: 'Colaborador',
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

export function SelectCompanyPage() {
  const { user, companies, selectCompany, logout } = useAuth()
  const [selecting, setSelecting] = useState('')
  const [error, setError] = useState('')

  async function handleSelect(company: ApiCompany) {
    setError('')
    setSelecting(company.id)
    try {
      await selectCompany(company.id)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível selecionar a empresa.')
    } finally {
      setSelecting('')
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', true)
  }

  return (
    <div className="select-page">
      <header className="select-header">
        <div className="brand">INFINITY<br /><span>CODE</span></div>
        <div className="select-user">
          <div>
            <strong>{user?.nome}</strong>
            <small>{user?.email}</small>
          </div>
          <button type="button" className="secondary" onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="select-main">
        <p className="eyebrow">Selecionar empresa</p>
        <h2>Em qual empresa você vai <em>atuar?</em></h2>
        <p className="select-description">Seu usuário tem acesso a mais de uma empresa. Escolha uma para continuar.</p>

        {error && <div className="form-alert" role="alert">{error}</div>}

        <div className="company-grid">
          {companies.map(company => (
            <button
              key={company.id}
              type="button"
              className="company-card"
              onClick={() => handleSelect(company)}
              disabled={Boolean(selecting)}
            >
              <span className="company-logo">{initials(company.nomeFantasia)}</span>
              <div className="company-info">
                <strong>{company.nomeFantasia}</strong>
                <small>{company.razaoSocial}</small>
                <span className="company-meta">
                  {papelLabel[company.papel]}
                  {company.cargo ? ` · ${company.cargo}` : ''}
                </span>
              </div>
              <span className="company-arrow">{selecting === company.id ? '…' : '→'}</span>
            </button>
          ))}
        </div>

        <p className="select-footnote">Ao entrar, você verá somente os dados da empresa selecionada.</p>
      </main>
    </div>
  )
}
