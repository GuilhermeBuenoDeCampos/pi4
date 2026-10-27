import type { ReactNode } from 'react'

type AuthShellProps = {
  eyebrow: string
  title: ReactNode
  description: string
  children: ReactNode
}

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="brand auth-brand">INFINITY<br /><span>CODE</span></div>
        <div className="auth-aside-copy">
          <p className="eyebrow">Desenvolvimento que transforma</p>
          <h1>Conhecimento para fazer <em>melhor.</em></h1>
          <p>Capacite equipes, padronize processos e transforme conhecimento em excelência operacional.</p>
        </div>
        <div className="auth-points">
          <div><span>◇</span><div><strong>Treinamentos</strong><small>Trilhas de aprendizagem por equipe</small></div></div>
          <div><span>▤</span><div><strong>Fichas técnicas</strong><small>Padrões sempre acessíveis</small></div></div>
          <div><span>⚙</span><div><strong>POPs</strong><small>Procedimentos claros e atualizados</small></div></div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-mobile-top">
          <div className="brand auth-brand">INFINITY<br /><span>CODE</span></div>
          <span>Desenvolvimento que transforma</span>
        </div>

        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {children}
        </section>

        <p className="auth-copyright">© 2025 Infinity Code</p>
      </main>
    </div>
  )
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <small className="field-error">{children}</small>
}
