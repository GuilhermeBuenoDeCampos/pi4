import { useState } from 'react'

type Page = 'dashboard' | 'trainings' | 'progress' | 'assessments' | 'certificates' | 'notifications' | 'profile' | 'products' | 'pops'

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Início', icon: '⌂' },
  { id: 'trainings', label: 'Meus treinamentos', icon: '◇' },
  { id: 'progress', label: 'Meu progresso', icon: '▥' },
  { id: 'assessments', label: 'Avaliações', icon: '☆' },
  { id: 'certificates', label: 'Certificados', icon: '♧' },
  { id: 'notifications', label: 'Notificações', icon: '♧' },
  { id: 'profile', label: 'Meu perfil', icon: '♙' },
  { id: 'products', label: 'Fichas técnicas', icon: '▤' },
  { id: 'pops', label: 'POP', icon: '⚙' },
]

const trainings = [
  { title: 'Boas Práticas na Cozinha', area: 'Cozinha', progress: 65, status: 'Em andamento' },
  { title: 'Atendimento no Balcão', area: 'Atendimento', progress: 30, status: 'Em andamento' },
  { title: 'Higienização de Utensílios', area: 'Higiene', progress: 100, status: 'Concluído' },
  { title: 'Segurança Alimentar', area: 'Qualidade', progress: 0, status: 'Pendente' },
]

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [toast, setToast] = useState('')
  const go = (next: Page) => setPage(next)
  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  return (
    <div className="app-shell">
      {page !== 'dashboard' && <Sidebar page={page} go={go} />}
      <main className={page === 'dashboard' ? 'main-content dashboard-content' : 'main-content'}>
        {page !== 'dashboard' && <Topbar title={pageTitle(page)} />}
        {page === 'dashboard' && <Dashboard go={go} />}
        {page === 'trainings' && <Trainings go={go} notify={notify} />}
        {page === 'progress' && <Progress />}
        {page === 'assessments' && <Assessments notify={notify} />}
        {page === 'certificates' && <Certificates notify={notify} />}
        {page === 'notifications' && <Notifications notify={notify} />}
        {page === 'profile' && <Profile notify={notify} />}
        {page === 'products' && <Products notify={notify} />}
        {page === 'pops' && <Pops notify={notify} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function pageTitle(page: Page) {
  const titles: Record<Page, string> = { dashboard: 'Dashboard do funcionário', trainings: 'Meus treinamentos', progress: 'Meu progresso', assessments: 'Avaliações', certificates: 'Certificados', notifications: 'Notificações', profile: 'Meu perfil', products: 'Fichas técnicas dos produtos', pops: 'Selecionar POP' }
  return titles[page]
}

function Sidebar({ page, go }: { page: Page; go: (page: Page) => void }) {
  return <aside className="sidebar">
    <div className="brand">INFINITY<br /><span>CODE</span></div>
    <nav>{navItems.map(item => <button key={item.id} className={page === item.id ? 'nav-item active' : 'nav-item'} onClick={() => go(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
    <button className="nav-item logout" onClick={() => go('dashboard')}><span className="nav-icon">↪</span>Sair</button>
  </aside>
}

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="topbar"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="user-chip"><span className="avatar">JS</span><strong>João da Silva</strong><span className="chevron">⌄</span></div></header>
}

function Dashboard({ go }: { go: (page: Page) => void }) {
  return <div className="dashboard-wrap"><Topbar title="Dashboard do funcionário" /><section className="hero"><div><p className="eyebrow">Bom dia, João</p><h2>Continue evoluindo<br /><em>com propósito.</em></h2><p>Você está a um passo de concluir seus próximos treinamentos.</p><button className="primary" onClick={() => go('trainings')}>Ver meus treinamentos <span>→</span></button></div><div className="hero-art"><div className="ring">68<small>%</small></div><span>progresso geral</span></div></section><div className="metric-grid"><Metric label="Treinamentos em andamento" value="02" caption="Continue de onde parou" icon="▣" /><Metric label="Treinamentos concluídos" value="04" caption="+1 este mês" icon="✓" /><Metric label="Taxa de aprovação" value="86%" caption="Excelente desempenho" icon="↗" /><Metric label="Próxima avaliação" value="22 mai" caption="Boas práticas na cozinha" icon="◷" /></div><section className="panel recent"><div className="section-heading"><div><p className="eyebrow">Sua jornada</p><h3>Últimos treinamentos</h3></div><button className="text-button" onClick={() => go('trainings')}>Ver todos →</button></div><TrainingTable compact /></section></div>
}

function Metric({ label, value, caption, icon }: { label: string; value: string; caption: string; icon: string }) {
  return <article className="metric-card"><span className="metric-icon">{icon}</span><p>{label}</p><strong>{value}</strong><small>{caption}</small></article>
}

function Trainings({ go, notify }: { go: (page: Page) => void; notify: (message: string) => void }) {
  const [filter, setFilter] = useState('Todos')
  const filters = ['Todos', 'Em andamento', 'Concluídos', 'Pendentes', 'Reprovados']
  const visible = filter === 'Todos' ? trainings : trainings.filter(item => item.status === filter.replace('Concluídos', 'Concluído').replace('Pendentes', 'Pendente'))
  return <><div className="page-intro"><div><p className="eyebrow">Sua trilha de desenvolvimento</p><h2>Meus treinamentos</h2><p>Acompanhe seu progresso e continue aprendendo.</p></div><button className="secondary" onClick={() => notify('Filtros avançados em breve')}>Filtrar resultados</button></div><div className="tabs">{filters.map(item => <button className={filter === item ? 'tab active' : 'tab'} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><section className="panel"><TrainingTable data={visible} go={go} notify={notify} /></section></>
}

function TrainingTable({ compact = false, data = trainings, go, notify }: { compact?: boolean; data?: typeof trainings; go?: (page: Page) => void; notify?: (message: string) => void }) {
  return <div className={compact ? 'data-table compact' : 'data-table'}><div className="table-row table-head"><span>Treinamento</span><span>Área</span><span>Progresso</span><span>Status</span><span>Ações</span></div>{data.map(item => <div className="table-row" key={item.title}><div><strong>{item.title}</strong><small>Trilha de desenvolvimento</small></div><span className="muted">{item.area}</span><div className="progress-cell"><strong>{item.progress}%</strong><ProgressBar value={item.progress} /></div><Status value={item.status} /><div className="actions">{!compact && <button className="small-button" onClick={() => notify?.(`${item.title} selecionado`)}>{item.progress ? 'Continuar' : 'Iniciar'}</button>}<button className="small-button ghost" onClick={() => go?.('progress')}>Detalhes</button></div></div>)}</div>
}

function ProgressBar({ value }: { value: number }) { return <div className="progress-bar"><span style={{ width: `${value}%` }} /></div> }
function Status({ value }: { value: string }) { return <span className={`status ${value.toLowerCase().replace(' ', '-')}`}>{value}</span> }

function Progress() {
  return <><div className="page-intro"><div><p className="eyebrow">Visão geral</p><h2>Meu progresso</h2><p>Veja como sua jornada está evoluindo em cada área.</p></div></div><div className="progress-cards"><article className="panel donut-card"><div className="donut" style={{ '--value': '68%' } as React.CSSProperties}><span>68%</span></div><div><h3>Conhecimento</h3><p>Você concluiu 68% dos conteúdos disponíveis.</p></div></article><article className="panel donut-card"><div className="donut light" style={{ '--value': '54%' } as React.CSSProperties}><span>54%</span></div><div><h3>Habilidade</h3><p>Você concluiu 54% das práticas avaliadas.</p></div></article></div><section className="panel"><div className="section-heading"><div><p className="eyebrow">Desempenho por área</p><h3>Evolução por área</h3></div></div>{[['Cozinha', 65], ['Atendimento', 30], ['Higienização', 100], ['Segurança alimentar', 0]].map(([label, value]) => <div className="bar-row" key={label as string}><strong>{label}</strong><ProgressBar value={value as number} /><b>{value}%</b></div>)}</section></>
}

function Assessments({ notify }: { notify: (message: string) => void }) { return <ListPage eyebrow="Avalie seu desempenho" title="Avaliações" description="Consulte suas avaliações teóricas e práticas." tabs={['Todas', 'Pendentes', 'Aprovadas', 'Reprovadas']}><div className="assessment-list">{[['Boas Práticas na Cozinha', 'Quiz', '10/05/2025', 'Aprovado', '9,0'], ['Atendimento no Balcão', 'Prática', '12/05/2025', 'Em análise', '—'], ['Segurança Alimentar', 'Quiz', 'Pendente', 'Pendente', '—']].map(row => <div className="assessment-row" key={row[0]}><div><strong>{row[0]}</strong><small>{row[1]}</small></div><span>{row[2]}</span><Status value={row[3]} /><strong>{row[4]}</strong><button className="small-button ghost" onClick={() => notify('Abrindo resultado da avaliação')}>{row[3] === 'Aprovado' ? 'Ver resultado' : 'Ver detalhes'}</button></div>)}</div></ListPage> }

function Certificates({ notify }: { notify: (message: string) => void }) { return <ListPage eyebrow="Conquistas desbloqueadas" title="Certificados" description="Seus certificados ficam disponíveis após a aprovação teórica e prática."><div className="info-banner"><span>i</span><div><strong>Certificados gerados automaticamente</strong><p>Complete as duas etapas de cada treinamento para liberar seu certificado.</p></div></div><div className="certificate-grid">{['Boas Práticas na Cozinha', 'Higienização de Utensílios', 'Atendimento no Balcão'].map((item, index) => <article className="certificate-card" key={item}><span className="certificate-seal">✦</span><div><p className="eyebrow">Certificado de conclusão</p><h3>{item}</h3><small>Concluído em {index ? '18/05/2025' : '10/05/2025'}</small></div><button className="secondary" onClick={() => notify('Download do certificado iniciado')}>Baixar PDF</button></article>)}</div></ListPage> }

function Notifications({ notify }: { notify: (message: string) => void }) { const items = [['Novo treinamento atribuído', 'Você recebeu um novo treinamento para realizar.', '20 mai, 09:15'], ['Avaliação prática aprovada', 'Parabéns! Você foi aprovado na avaliação prática.', '19 mai, 14:32'], ['Avaliação prática reprovada', 'Você não foi aprovado na avaliação prática.', '18 mai, 11:07'], ['Lembrete de avaliação próxima', 'Você tem uma avaliação agendada em breve.', '17 mai, 16:45']]; return <ListPage eyebrow="Central de avisos" title="Notificações" description="Acompanhe as novidades da sua jornada."><div className="notification-actions"><div className="tabs"><button className="tab active">Todas</button><button className="tab">Não lidas</button><button className="tab">Lidas</button></div><button className="secondary" onClick={() => notify('Todas as notificações foram marcadas como lidas')}>Marcar todas como lidas</button></div><section className="panel notifications-list">{items.map((item, index) => <div className="notification-row" key={item[0]}><span className={index < 3 ? 'unread-dot' : 'read-dot'} /><div><strong>{item[0]}</strong><p>{item[1]}</p></div><time>{item[2]}</time><span className="muted">›</span></div>)}</section></ListPage> }

function Profile({ notify }: { notify: (message: string) => void }) { return <><div className="page-intro"><div><p className="eyebrow">Sua conta</p><h2>Meu perfil</h2><p>Gerencie seus dados pessoais e informações de acesso.</p></div></div><div className="profile-layout"><div className="profile-avatar">JS</div><div className="profile-sections"><section className="panel profile-panel"><div className="section-heading"><h3>Dados pessoais</h3><button className="secondary" onClick={() => notify('Modo de edição ativado')}>Editar perfil</button></div>{[['Nome', 'João da Silva'], ['E-mail', 'joao.silva@email.com'], ['Cargo', 'Auxiliar de Cozinha'], ['Área', 'Cozinha'], ['Data de admissão', '12/02/2024']].map(row => <div className="detail-row" key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong></div>)}</section><section className="panel profile-panel"><div className="section-heading"><h3>Dados de acesso</h3><button className="secondary" onClick={() => notify('Link para alteração de senha enviado')}>Alterar senha</button></div><div className="detail-row"><span>E-mail de acesso</span><strong>joao.silva@email.com</strong></div><div className="detail-row"><span>Senha</span><strong>••••••••</strong></div></section></div></div></> }

function Products({ notify }: { notify: (message: string) => void }) { return <ListPage eyebrow="Base de conhecimento" title="Fichas técnicas dos produtos" description="Selecione um produto para consultar sua ficha técnica."><div className="product-grid">{[['Pastel de Carne', '25 unidades', '30 minutos', 'Ativa'], ['Pastel de Queijo', '25 unidades', '25 minutos', 'Ativa'], ['Pastel de Frango com Catupiry', '25 unidades', '35 minutos', 'Em revisão'], ['Coxinha de Frango', '30 unidades', '40 minutos', 'Ativa']].map(item => <article className="product-card" key={item[0]}><div className="product-image">♨</div><div className="product-name"><strong>{item[0]}</strong><small>Categoria · Salgados</small></div><div><small>Rendimento</small><strong>{item[1]}</strong></div><div><small>Tempo de preparo</small><strong>{item[2]}</strong></div><Status value={item[3]} /><button className="small-button ghost" onClick={() => notify(`Ficha de ${item[0]} aberta`)}>Abrir ficha</button></article>)}</div></ListPage> }

function Pops({ notify }: { notify: (message: string) => void }) { return <ListPage eyebrow="Procedimentos operacionais" title="Selecionar POP" description="Escolha um procedimento para consultar."><div className="pop-list">{[['Higienização de Utensílios', 'Limpeza e desinfecção dos utensílios', '15 minutos', 'Concluído'], ['Higienização das Mãos', 'Lavagem correta antes e durante a produção', '5 minutos', 'Pendente'], ['Organização da Bancada', 'Preparação e organização do posto de trabalho', '10 minutos', 'Em andamento'], ['Armazenamento de Ingredientes', 'Identificação, validade e conservação dos produtos', '20 minutos', 'Pendente']].map(item => <article className="pop-card" key={item[0]}><div className="product-image">✧</div><div className="product-name"><strong>{item[0]}</strong><small>{item[1]}</small></div><div><small>Responsável</small><strong>Auxiliar de cozinha</strong></div><div><small>Tempo estimado</small><strong>{item[2]}</strong></div><Status value={item[3]} /><button className="small-button ghost" onClick={() => notify(`POP ${item[0]} aberto`)}>Abrir POP</button></article>)}</div></ListPage> }

function ListPage({ eyebrow, title, description, tabs, children }: { eyebrow: string; title: string; description: string; tabs?: string[]; children: React.ReactNode }) { return <><div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div></div>{tabs && <div className="tabs">{tabs.map((tab, index) => <button className={index === 0 ? 'tab active' : 'tab'} key={tab}>{tab}</button>)}</div>}{children}</> }

export default App
