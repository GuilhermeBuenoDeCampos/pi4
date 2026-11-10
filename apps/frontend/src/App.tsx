import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { navigate, Redirect, usePathname } from './router'
import { LoginPage } from './pages/LoginPage'
import { SelectCompanyPage } from './pages/SelectCompanyPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { NewCollaboratorPage } from './pages/NewCollaboratorPage'
import { RegisterCompanyPage } from './pages/RegisterCompanyPage'
import { api, ApiError } from './lib/api'

type Page = 'landing' | 'dashboard' | 'trainings' | 'course' | 'progress' | 'assessments' | 'certificates' | 'notifications' | 'profile' | 'products' | 'pops' | 'history' | 'collaborators'

const managerNavItem: { id: Page; label: string; icon: string } = { id: 'collaborators', label: 'Colaboradores', icon: '☷' }

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
  { id: 'history', label: 'Histórico de visualizações', icon: '◷' },
]

type CourseVideo = { title: string; duration: string; youtubeId: string; transcript?: string }
type CoursePop = { title: string; description: string }
type CourseFicha = { title: string; category: string }

type Course = {
  id: string
  title: string
  area: string
  progress: number
  status: string
  description: string
  instructor: string
  duration: string
  videos: CourseVideo[]
  pops: CoursePop[]
  fichas: CourseFicha[]
}

async function saveTraining(training: Course) {
  const response = await api.put<{ training: Course }>(`/api/trainings/${training.id}`, training)
  return response.training
}

const trainings: Course[] = [
  {
    id: 'boas-praticas-cozinha',
    title: 'Boas Práticas na Cozinha',
    area: 'Cozinha',
    progress: 65,
    status: 'Em andamento',
    description: 'Aprenda os cuidados essenciais de higiene, organização e manipulação de alimentos para manter a cozinha segura e padronizada.',
    instructor: 'Marina Alves',
    duration: '2h 40min',
    videos: [
      { title: 'Introdução às boas práticas', duration: '08:12', youtubeId: 'ZUvV_C5HxY4' },
      { title: 'Higiene pessoal e uniforme', duration: '11:45', youtubeId: 'xLcPuu-8__I' },
      { title: 'Organização do posto de trabalho', duration: '09:30', youtubeId: 'Du6ZzY0965s' },
      { title: 'Contaminação cruzada', duration: '13:20', youtubeId: 'X1AHfNmLvOU' },
      { title: 'Checklist diário da cozinha', duration: '07:05', youtubeId: 'ODgiXaSvTDI' },
    ],
    pops: [
      { title: 'Higienização das Mãos', description: 'Lavagem correta antes e durante a produção' },
      { title: 'Organização da Bancada', description: 'Preparação e organização do posto de trabalho' },
      { title: 'Armazenamento de Ingredientes', description: 'Identificação, validade e conservação dos produtos' },
    ],
    fichas: [
      { title: 'Pastel de Carne', category: 'Salgados' },
      { title: 'Coxinha de Frango', category: 'Salgados' },
    ],
  },
  {
    id: 'atendimento-balcao',
    title: 'Atendimento no Balcão',
    area: 'Atendimento',
    progress: 30,
    status: 'Em andamento',
    description: 'Desenvolva uma comunicação clara, acolhedora e eficiente para oferecer uma experiência de atendimento consistente ao cliente.',
    instructor: 'Rafael Nogueira',
    duration: '1h 55min',
    videos: [
      { title: 'A primeira impressão no balcão', duration: '09:40', youtubeId: 'dpU6VjDMnus' },
      { title: 'Comunicação e tom de voz', duration: '12:15', youtubeId: 'iJLzVMBNfLs' },
      { title: 'Como lidar com reclamações', duration: '14:05', youtubeId: '4Oxou-kAtDQ' },
      { title: 'Fechamento e agradecimento', duration: '06:50', youtubeId: '9Oy7Uo5QGrA' },
    ],
    pops: [
      { title: 'Abertura do Balcão', description: 'Conferência e preparação para o atendimento' },
      { title: 'Atendimento ao Cliente', description: 'Fluxo padrão de recebimento, pedido e entrega' },
    ],
    fichas: [
      { title: 'Pastel de Queijo', category: 'Salgados' },
      { title: 'Pastel de Frango com Catupiry', category: 'Salgados' },
    ],
  },
  {
    id: 'higienizacao-utensilios',
    title: 'Higienização de Utensílios',
    area: 'Higiene',
    progress: 100,
    status: 'Concluído',
    description: 'Domine o processo correto de limpeza e desinfecção de utensílios, garantindo segurança e prolongando a vida útil dos equipamentos.',
    instructor: 'Camila Ribeiro',
    duration: '1h 20min',
    videos: [
      { title: 'Por que higienizar corretamente', duration: '07:20', youtubeId: 'Zo8xvJFYEHs' },
      { title: 'Etapas da limpeza e desinfecção', duration: '10:35', youtubeId: 'M9rZogjhcbY' },
      { title: 'Produtos e diluições', duration: '08:50', youtubeId: 'Du6ZzY0965s' },
      { title: 'Armazenamento dos utensílios', duration: '05:40', youtubeId: 'xNDIhRMIPMI' },
    ],
    pops: [
      { title: 'Higienização de Utensílios', description: 'Limpeza e desinfecção dos utensílios' },
      { title: 'Higienização das Mãos', description: 'Lavagem correta antes e durante a produção' },
    ],
    fichas: [
      { title: 'Pastel de Carne', category: 'Salgados' },
    ],
  },
  {
    id: 'seguranca-alimentar',
    title: 'Segurança Alimentar',
    area: 'Qualidade',
    progress: 0,
    status: 'Pendente',
    description: 'Entenda os riscos de contaminação e as boas práticas de armazenamento, temperatura e validade para proteger a saúde dos clientes.',
    instructor: 'Bruno Martins',
    duration: '2h 10min',
    videos: [
      { title: 'Introdução à segurança alimentar', duration: '10:00', youtubeId: 'ycy-3rdtzkg' },
      { title: 'Temperaturas e zonas de risco', duration: '13:45', youtubeId: 'E0jGNIds3YA' },
      { title: 'Rotulagem e controle de validade', duration: '11:30', youtubeId: 'o1vf9XZ66AA' },
      { title: 'Doenças transmitidas por alimentos', duration: '12:10', youtubeId: 'hQuzV92oqDw' },
    ],
    pops: [
      { title: 'Armazenamento de Ingredientes', description: 'Identificação, validade e conservação dos produtos' },
      { title: 'Controle de Temperatura', description: 'Monitoramento de câmaras e equipamentos' },
    ],
    fichas: [
      { title: 'Coxinha de Frango', category: 'Salgados' },
      { title: 'Pastel de Queijo', category: 'Salgados' },
    ],
  },
]

function PlatformApp({ initialPage = 'landing' }: { initialPage?: Page }) {
  const { user, activeCompany, canManage, logout } = useAuth()
  const [courses, setCourses] = useState(trainings)
  const [page, setPage] = useState<Page>(initialPage)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const selectedCourse = courses.find(course => course.id === courseId) ?? null
  const canEditTrainings = activeCompany?.papel === 'ADMIN' || activeCompany?.papel === 'GESTOR' || activeCompany?.papel === 'INSTRUTOR'
  useEffect(() => {
    let active = true
    if (user && activeCompany) {
      api.get<Course[]>('/api/trainings').then(data => {
        if (active) setCourses(data)
      }).catch(error => {
        if (active) console.error('Não foi possível carregar os treinamentos salvos.', error)
      })
    }
    return () => { active = false }
  }, [user, activeCompany])
  const openCourse = (id: string) => {
    setCourseId(id)
    setPage('course')
  }
  const go = (next: Page) => {
    if (!user && next !== 'landing') {
      navigate('/login')
      return
    }
    setPage(next)
  }
  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }
  const handleLogout = async () => {
    await logout()
    navigate('/login', true)
  }

  return (
    <div className="app-shell">
      {page !== 'landing' && <Sidebar page={page} go={go} canManage={canManage} onLogout={handleLogout} />}
      <main className={page === 'dashboard' ? 'main-content dashboard-content' : page === 'landing' ? 'landing-content' : 'main-content'}>
        {page === 'landing' && <Landing go={go} />}
        {page !== 'dashboard' && page !== 'landing' && <Topbar title={pageTitle(page, selectedCourse?.title)} />}
        {page === 'dashboard' && <Dashboard go={go} openCourse={openCourse} courses={courses} />}
        {page === 'trainings' && <Trainings go={go} notify={notify} openCourse={openCourse} courses={courses} setCourses={setCourses} canCreate={canEditTrainings} canEdit={canEditTrainings} />}
        {page === 'course' && selectedCourse && <CourseDetail course={selectedCourse} go={go} notify={notify} canEdit={canEditTrainings} onUpdate={async updated => { const saved = await saveTraining(updated); setCourses(current => current.map(item => item.id === saved.id ? saved : item)); notify('Treinamento atualizado com sucesso.') }} onBack={() => setPage('trainings')} />}
        {page === 'progress' && <Progress />}
        {page === 'assessments' && <Assessments notify={notify} />}
        {page === 'certificates' && <Certificates notify={notify} />}
        {page === 'notifications' && <Notifications notify={notify} />}
        {page === 'profile' && <Profile notify={notify} />}
        {page === 'products' && <Products notify={notify} canManage={canManage} />}
        {page === 'pops' && <Pops notify={notify} canManage={canManage} />}
        {page === 'history' && <ViewHistory />}
        {page === 'collaborators' && <NewCollaboratorPage notify={notify} onBack={() => setPage('dashboard')} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function pageTitle(page: Page, courseTitle?: string) {
  const titles: Record<Page, string> = { landing: 'Infinity Code', dashboard: 'Dashboard do funcionário', trainings: 'Meus treinamentos', course: courseTitle ?? 'Detalhes do curso', progress: 'Meu progresso', assessments: 'Avaliações', certificates: 'Certificados', notifications: 'Notificações', profile: 'Meu perfil', products: 'Fichas técnicas dos produtos', pops: 'Selecionar POP', history: 'Histórico de visualizações', collaborators: 'Colaboradores' }
  return titles[page]
}

function Landing({ go }: { go: (page: Page) => void }) {
  return <div className="landing-page">
    <header className="landing-nav">
      <div className="brand landing-brand">INFINITY<br /><span>CODE</span></div>
      <nav><a href="#solucao">A solução</a><a href="#recursos">Recursos</a><a href="#beneficios">Benefícios</a></nav>
      <div className="landing-auth-actions">
        <button className="landing-register" type="button" onClick={() => navigate('/register')}>Registrar-se</button>
        <button className="landing-login" onClick={() => navigate('/login')}>Entrar <span>→</span></button>
      </div>
    </header>
    <section className="landing-hero">
      <div className="landing-hero-copy">
        <p className="eyebrow">Desenvolvimento que transforma</p>
        <h1>Conhecimento para fazer <em>melhor.</em></h1>
        <p className="landing-lead">Uma plataforma completa para capacitar equipes, padronizar processos e transformar conhecimento em excelência operacional.</p>
        <div className="landing-actions"><button className="primary landing-primary" onClick={() => go('dashboard')}>Conheça a plataforma <span>→</span></button><a href="#recursos" className="play-link"><span>▷</span> Explorar recursos</a></div>
        <div className="landing-proof"><div className="proof-avatars"><span>JS</span><span>MA</span><span>RC</span><b>+</b></div><p><strong>Mais de 500 profissionais</strong><br />aprendendo todos os dias</p></div>
      </div>
      <div className="landing-visual">
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        <div className="visual-card visual-main-card"><div className="visual-card-top"><span>Seu progresso</span><b>⋮</b></div><div className="visual-progress"><div className="visual-ring"><strong>68<small>%</small></strong></div><div><strong>Você está evoluindo!</strong><p>4 de 6 treinamentos concluídos</p></div></div><div className="mini-bars"><span style={{ width: '85%' }} /><span style={{ width: '62%' }} /><span style={{ width: '46%' }} /></div></div>
        <div className="floating-card training-float"><span className="float-icon">✓</span><div><strong>Treinamento concluído</strong><small>Boas práticas na cozinha</small></div></div>
        <div className="floating-card pop-float"><span className="float-icon">✦</span><div><strong>POP atualizado</strong><small>Higienização de utensílios</small></div></div>
      </div>
    </section>
    <section className="landing-logos"><span>Feito para equipes que buscam</span><strong>PADRÃO</strong><strong>QUALIDADE</strong><strong>EVOLUÇÃO</strong><strong>RESULTADO</strong></section>
    <section className="landing-section" id="solucao"><div className="landing-section-heading"><p className="eyebrow">Tudo em um só lugar</p><h2>O próximo nível da sua equipe<br /><em>começa aqui.</em></h2><p>Centralize o desenvolvimento das pessoas e a operação do negócio em uma experiência simples, visual e feita para a rotina.</p></div><div className="feature-grid" id="recursos"><FeatureCard icon="◇" number="01" title="Treinamentos" text="Trilhas de aprendizagem para desenvolver habilidades e acompanhar a evolução de cada profissional." action={() => go('trainings')} /><FeatureCard icon="▤" number="02" title="Fichas técnicas" text="Receitas, rendimentos e padrões sempre acessíveis para garantir consistência em cada preparo." action={() => go('products')} /><FeatureCard icon="⚙" number="03" title="POPs" text="Procedimentos claros e atualizados para orientar a equipe e manter a excelência operacional." action={() => go('pops')} /></div></section>
    <section className="landing-benefits" id="beneficios"><div><p className="eyebrow">Resultados que aparecem na prática</p><h2>Mais clareza para quem<br /><em>ensina e para quem faz.</em></h2><p>Com a Infinity Code, sua equipe sabe o que fazer, como fazer e por que cada detalhe importa.</p><button className="landing-text-button" onClick={() => go('dashboard')}>Ver a plataforma em ação <span>→</span></button></div><div className="benefit-list"><Benefit icon="↗" title="Acompanhe a evolução" text="Indicadores claros para identificar avanços e oportunidades." /><Benefit icon="♧" title="Padronize a operação" text="Conhecimento acessível para entregar o mesmo padrão sempre." /><Benefit icon="♡" title="Engaje sua equipe" text="Uma jornada simples que valoriza cada conquista." /></div></section>
    <section className="landing-cta"><p className="eyebrow">Pronto para começar?</p><h2>Conhecimento que vira<br /><em>resultado.</em></h2><p>Leve mais confiança, padrão e evolução para a rotina da sua equipe.</p><button className="primary landing-primary" onClick={() => go('dashboard')}>Acessar a plataforma <span>→</span></button></section>
    <footer className="landing-footer"><div className="brand">INFINITY<br /><span>CODE</span></div><span>Desenvolvimento que transforma.</span><span>© 2025 Infinity Code</span></footer>
  </div>
}

function FeatureCard({ icon, number, title, text, action }: { icon: string; number: string; title: string; text: string; action: () => void }) {
  return <article className="feature-card"><div className="feature-card-top"><span className="feature-icon">{icon}</span><small>{number}</small></div><h3>{title}</h3><p>{text}</p><button onClick={action}>Saiba mais <span>→</span></button></article>
}

function Benefit({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className="benefit-item"><span className="benefit-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></div>
}

function Sidebar({ page, go, canManage, onLogout }: { page: Page; go: (page: Page) => void; canManage: boolean; onLogout: () => void }) {
  const items = canManage ? [...navItems, managerNavItem] : navItems
  return <aside className="sidebar">
    <div className="brand">INFINITY<br /><span>CODE</span></div>
    <nav>{items.map(item => <button key={item.id} className={page === item.id ? 'nav-item active' : 'nav-item'} onClick={() => go(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
    <button className="nav-item logout" onClick={onLogout}><span className="nav-icon">↪</span>Sair</button>
  </aside>
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth()
  const userName = user?.nome ?? 'João da Silva'
  return <header className="topbar"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="user-chip">{user?.fotoUrl ? <img className="avatar avatar-image" src={user.fotoUrl} alt="" /> : <span className="avatar">{initials(userName)}</span>}<strong>{userName}</strong><span className="chevron">⌄</span></div></header>
}

function Dashboard({ go, openCourse, courses }: { go: (page: Page) => void; openCourse: (id: string) => void; courses: Course[] }) {
  const { user } = useAuth()
  const firstName = user?.nome.split(' ')[0] ?? 'João'
  return <div className="dashboard-wrap"><Topbar title="Dashboard do funcionário" /><section className="hero"><div><p className="eyebrow">Bom dia, {firstName}</p><h2>Continue evoluindo<br /><em>com propósito.</em></h2><p>Você está a um passo de concluir seus próximos treinamentos.</p><button className="primary" onClick={() => go('trainings')}>Ver meus treinamentos <span>→</span></button></div><div className="hero-art"><div className="ring">68<small>%</small></div><span>progresso geral</span></div></section><div className="metric-grid"><Metric label="Treinamentos em andamento" value="02" caption="Continue de onde parou" icon="▣" /><Metric label="Treinamentos concluídos" value="04" caption="+1 este mês" icon="✓" /><Metric label="Taxa de aprovação" value="86%" caption="Excelente desempenho" icon="↗" /><Metric label="Próxima avaliação" value="22 mai" caption="Boas práticas na cozinha" icon="◷" /></div><section className="panel recent"><div className="section-heading"><div><p className="eyebrow">Sua jornada</p><h3>Últimos treinamentos</h3></div><button className="text-button" onClick={() => go('trainings')}>Ver todos →</button></div><TrainingTable compact data={courses} onOpen={openCourse} /></section></div>
}

function Metric({ label, value, caption, icon }: { label: string; value: string; caption: string; icon: string }) {
  return <article className="metric-card"><span className="metric-icon">{icon}</span><p>{label}</p><strong>{value}</strong><small>{caption}</small></article>
}

function Trainings({ go, notify, openCourse, courses, setCourses, canCreate, canEdit }: { go: (page: Page) => void; notify: (message: string) => void; openCourse: (id: string) => void; courses: Course[]; setCourses: React.Dispatch<React.SetStateAction<Course[]>>; canCreate: boolean; canEdit: boolean }) {
  const [filter, setFilter] = useState('Todos')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTraining, setNewTraining] = useState({ title: '', area: '', description: '', instructor: '', duration: '' })
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const filters = ['Todos', 'Em andamento', 'Concluídos', 'Pendentes', 'Reprovados']
  const visible = filter === 'Todos' ? courses : courses.filter(item => item.status === filter.replace('Concluídos', 'Concluído').replace('Pendentes', 'Pendente'))
  useEffect(() => {
    let active = true
    api.get<Course[]>('/api/trainings').then(data => {
      if (active && data.length) setCourses(data)
    }).catch(() => {
      if (active) notify('Não foi possível carregar os treinamentos salvos.')
    })
    return () => { active = false }
  }, [setCourses])
  function updateNewTraining(key: keyof typeof newTraining, value: string) {
    setNewTraining(current => ({ ...current, [key]: value }))
  }
  async function createTraining(event: React.FormEvent) {
    event.preventDefault()
    if (!newTraining.title.trim() || !newTraining.area.trim() || !newTraining.description.trim() || !newTraining.instructor.trim() || !newTraining.duration.trim()) {
      notify('Preencha todos os campos para criar o treinamento.')
      return
    }
    try {
      const response = await api.post<{ training: Course }>('/api/trainings', {
        title: newTraining.title,
        area: newTraining.area,
        description: newTraining.description,
        instructor: newTraining.instructor,
        duration: newTraining.duration,
        videos: [],
      })
      setCourses(current => [response.training, ...current.filter(item => item.id !== response.training.id)])
      setNewTraining({ title: '', area: '', description: '', instructor: '', duration: '' })
      setShowCreateForm(false)
      notify('Treinamento criado com sucesso.')
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Não foi possível salvar o treinamento.')
    }
  }
  async function updateCourse(updated: Course) {
    try {
      const saved = await saveTraining(updated)
      setCourses(current => current.map(item => item.id === saved.id ? saved : item))
      setEditingCourse(null)
      notify('Treinamento atualizado com sucesso.')
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Não foi possível salvar o treinamento.')
    }
  }
  return <><div className="page-intro"><div><p className="eyebrow">Sua trilha de desenvolvimento</p><h2>Meus treinamentos</h2><p>Acompanhe seu progresso e continue aprendendo.</p></div><div className="training-page-actions">{canCreate && <button className="primary create-training-button" onClick={() => setShowCreateForm(current => !current)}>{showCreateForm ? 'Fechar formulário' : 'Novo treinamento'} <span>{showCreateForm ? '×' : '+'}</span></button>}<button className="secondary" onClick={() => notify('Filtros avançados em breve')}>Filtrar resultados</button></div></div>{showCreateForm && <form className="panel create-training-form" onSubmit={createTraining}><div className="section-heading"><div><p className="eyebrow">Área de gestão</p><h3>Novo treinamento</h3></div></div><div className="form-grid"><label className="field"><span>Nome do treinamento</span><input className="input" value={newTraining.title} onChange={event => updateNewTraining('title', event.target.value)} /></label><label className="field"><span>Área</span><input className="input" value={newTraining.area} onChange={event => updateNewTraining('area', event.target.value)} placeholder="Ex.: Atendimento" /></label><label className="field"><span>Instrutor</span><input className="input" value={newTraining.instructor} onChange={event => updateNewTraining('instructor', event.target.value)} /></label><label className="field"><span>Carga horária</span><input className="input" value={newTraining.duration} onChange={event => updateNewTraining('duration', event.target.value)} placeholder="Ex.: 2h 30min" /></label><label className="field field-wide"><span>Descrição</span><textarea className="input create-training-description" value={newTraining.description} onChange={event => updateNewTraining('description', event.target.value)} rows={3} /></label></div><div className="form-actions"><button className="form-submit" type="submit">Criar treinamento <span>→</span></button></div></form>}{editingCourse && <CourseEditor course={editingCourse} onSave={updateCourse} onCancel={() => setEditingCourse(null)} /> }<div className="tabs">{filters.map(item => <button className={filter === item ? 'tab active' : 'tab'} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><section className="panel"><TrainingTable data={visible} go={go} notify={notify} onOpen={openCourse} canEdit={canEdit} onEdit={setEditingCourse} /></section></>
}

function TrainingTable({ compact = false, data = trainings, go, notify, onOpen, canEdit = false, onEdit }: { compact?: boolean; data?: Course[]; go?: (page: Page) => void; notify?: (message: string) => void; onOpen?: (id: string) => void; canEdit?: boolean; onEdit?: (course: Course) => void }) {
  return <div className={compact ? 'data-table compact' : 'data-table'}><div className="table-row table-head"><span>Treinamento</span><span>Área</span><span>Progresso</span><span>Status</span><span>Ações</span></div>{data.map(item => <div className="table-row" key={item.title}><div><strong>{item.title}</strong><small>{item.videos.length} aulas • {item.pops.length} POPs • {item.fichas.length} fichas</small></div><span className="muted">{item.area}</span><div className="progress-cell"><strong>{item.progress}%</strong><ProgressBar value={item.progress} /></div><Status value={item.status} /><div className="actions">{!compact && <button className="small-button" onClick={() => { if (!item.videos.length) { notify?.('Adicione uma aula em vídeo antes de iniciar este treinamento.'); return } notify?.(`${item.title} selecionado`); onOpen?.(item.id) }}>{item.progress ? 'Continuar' : 'Iniciar'}</button>}<button className="small-button ghost" onClick={() => { if (onOpen && item.videos.length) onOpen(item.id); else if (onOpen) notify?.('Adicione uma aula em vídeo para acessar o treinamento.'); else go?.('progress') }}>Detalhes</button>{canEdit && !compact && <button className="icon-button" title="Editar treinamento e aulas" aria-label={`Editar ${item.title}`} onClick={() => onEdit?.(item)}>✎</button>}</div></div>)}</div>
}

function ProgressBar({ value }: { value: number }) { return <div className="progress-bar"><span style={{ width: `${value}%` }} /></div> }
function Status({ value }: { value: string }) { return <span className={`status ${value.toLowerCase().replace(' ', '-')}`}>{value}</span> }

type SpeechRecognitionResultEvent = Event & {
  results: SpeechRecognitionResultList
  resultIndex: number
}

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function CourseEditor({ course, onSave, onCancel }: { course: Course; onSave: (course: Course) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(course)
  const [newVideo, setNewVideo] = useState({ title: '', duration: '', youtubeId: '', transcript: '' })
  const [saving, setSaving] = useState(false)
  const update = (key: 'title' | 'area' | 'instructor' | 'duration' | 'description', value: string) => {
    setDraft(current => ({ ...current, [key]: value }))
  }
  const updateVideo = (index: number, key: keyof CourseVideo, value: string) => {
    setDraft(current => ({ ...current, videos: current.videos.map((video, videoIndex) => videoIndex === index ? { ...video, [key]: value } : video) }))
  }
  const removeVideo = (index: number) => {
    setDraft(current => ({ ...current, videos: current.videos.filter((_, videoIndex) => videoIndex !== index) }))
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.title.trim() || !draft.area.trim() || !draft.instructor.trim() || !draft.duration.trim() || !draft.description.trim()) return
    setSaving(true)
    try {
      await onSave({ ...draft, title: draft.title.trim(), area: draft.area.trim(), instructor: draft.instructor.trim(), duration: draft.duration.trim(), description: draft.description.trim() })
    } finally {
      setSaving(false)
    }
  }
  function addVideo() {
    if (!newVideo.title.trim() || !newVideo.duration.trim() || !newVideo.youtubeId.trim()) return
    setDraft(current => ({ ...current, videos: [...current.videos, { title: newVideo.title.trim(), duration: newVideo.duration.trim(), youtubeId: newVideo.youtubeId.trim(), transcript: newVideo.transcript.trim() }] }))
    setNewVideo({ title: '', duration: '', youtubeId: '', transcript: '' })
  }
  return <form className="panel course-editor" onSubmit={submit}>
    <div className="section-heading"><div><p className="eyebrow">Área de gestão</p><h3>Editar treinamento e aulas</h3></div></div>
    <div className="form-grid">
      <label className="field"><span>Nome do treinamento</span><input className="input" value={draft.title} onChange={event => update('title', event.target.value)} /></label>
      <label className="field"><span>Área</span><input className="input" value={draft.area} onChange={event => update('area', event.target.value)} /></label>
      <label className="field"><span>Instrutor</span><input className="input" value={draft.instructor} onChange={event => update('instructor', event.target.value)} /></label>
      <label className="field"><span>Carga horária</span><input className="input" value={draft.duration} onChange={event => update('duration', event.target.value)} /></label>
      <label className="field field-wide"><span>Descrição</span><textarea className="input create-training-description" value={draft.description} onChange={event => update('description', event.target.value)} rows={3} /></label>
    </div>
    <div className="course-editor-lessons"><div className="section-heading"><div><p className="eyebrow">Conteúdo</p><h3>Aulas em vídeo</h3></div></div>
      {draft.videos.map((video, index) => <div className="course-editor-video" key={`${video.youtubeId}-${index}`}><div className="course-editor-video-fields"><label className="field"><span>Título da aula</span><input className="input" value={video.title} onChange={event => updateVideo(index, 'title', event.target.value)} /></label><label className="field"><span>Duração</span><input className="input" value={video.duration} onChange={event => updateVideo(index, 'duration', event.target.value)} /></label><label className="field field-wide"><span>ID do vídeo no YouTube</span><input className="input" value={video.youtubeId} onChange={event => updateVideo(index, 'youtubeId', event.target.value)} /></label><label className="field field-wide"><span>Transcrição do vídeo</span><textarea className="input video-transcript-input" value={video.transcript} onChange={event => updateVideo(index, 'transcript', event.target.value)} rows={4} placeholder="Cole aqui a transcrição desta aula..." /></label></div><button className="small-button danger-button" type="button" onClick={() => removeVideo(index)}>Remover aula</button></div>)}
      <div className="course-editor-add"><label className="field"><span>Nova aula</span><input className="input" value={newVideo.title} onChange={event => setNewVideo(current => ({ ...current, title: event.target.value }))} placeholder="Título da aula" /></label><label className="field"><span>Duração</span><input className="input" value={newVideo.duration} onChange={event => setNewVideo(current => ({ ...current, duration: event.target.value }))} placeholder="Ex.: 08:12" /></label><label className="field"><span>ID do YouTube</span><input className="input" value={newVideo.youtubeId} onChange={event => setNewVideo(current => ({ ...current, youtubeId: event.target.value }))} placeholder="Ex.: ZUvV_C5HxY4" /></label><label className="field field-wide"><span>Transcrição do vídeo</span><textarea className="input video-transcript-input" value={newVideo.transcript} onChange={event => setNewVideo(current => ({ ...current, transcript: event.target.value }))} rows={4} placeholder="Cole aqui a transcrição desta aula..." /></label><button className="secondary" type="button" onClick={addVideo}>Adicionar aula</button></div>
    </div>
    <div className="form-actions"><button className="form-submit" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'} {!saving && <span>✓</span>}</button><button className="secondary" type="button" onClick={onCancel} disabled={saving}>Cancelar</button></div>
  </form>
}

function KnowledgeRecorder({ trainingId, video }: { trainingId: string; video: CourseVideo }) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [error, setError] = useState('')
  const [evaluation, setEvaluation] = useState<TrainingEvaluation | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      recognitionRef.current?.stop()
      setIsRecording(false)
      setInterimTranscript('')
      return
    }

    const SpeechRecognition = (window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }).SpeechRecognition ?? (window as Window & {
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('A transcrição em tempo real não é compatível com este navegador. Use o Google Chrome ou Edge.')
      return
    }

    setError('')
    setEvaluation(null)
    setTranscript('')
    setInterimTranscript('')
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl('')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        const recording = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudioUrl(URL.createObjectURL(recording))
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'pt-BR'
      recognition.onresult = event => {
        let finalText = ''
        let temporaryText = ''
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const text = event.results[index][0].transcript
          if (event.results[index].isFinal) finalText += text
          else temporaryText += text
        }
        if (finalText) setTranscript(current => `${current}${current ? ' ' : ''}${finalText.trim()}`)
        setInterimTranscript(temporaryText)
      }
      recognition.onerror = () => {
        setError('Não foi possível transcrever sua fala. Verifique a permissão do microfone e tente novamente.')
      }
      recognitionRef.current = recognition
      mediaRecorderRef.current = recorder
      recorder.start()
      recognition.start()
      setIsRecording(true)
    } catch {
      setError('Não foi possível acessar o microfone. Autorize o acesso para iniciar a gravação.')
    }
  }

  return <section className="knowledge-recorder" aria-live="polite">
    <div className="knowledge-recorder-heading">
      <div>
        <p className="eyebrow">Reflexão da aula</p>
        <h3>Teste seu conhecimento</h3>
        <p>Grave sua resposta falando o que você aprendeu. A transcrição aparecerá em tempo real.</p>
      </div>
      <button className={isRecording ? 'record-button recording' : 'record-button'} onClick={toggleRecording} type="button">
        <span className="record-button-icon">{isRecording ? '■' : '●'}</span>
        {isRecording ? 'Parar gravação' : 'Começar gravação'}
      </button>
    </div>
    <div className={isRecording ? 'transcript-box listening' : 'transcript-box'}>
      {transcript || interimTranscript ? <>{transcript}<span className="transcript-interim">{interimTranscript}</span></> : <span className="transcript-placeholder">Sua transcrição aparecerá aqui...</span>}
    </div>
    {isRecording && <p className="recording-status"><span /> Ouvindo e transcrevendo...</p>}
    {audioUrl && !isRecording && <div className="recording-preview"><span>Gravação salva nesta sessão</span><audio controls src={audioUrl}>Seu navegador não suporta áudio.</audio></div>}
    {transcript && !isRecording && <button className="secondary evaluate-button" type="button" disabled={evaluating} onClick={async () => {
      setEvaluating(true)
      setError('')
      try {
        const response = await api.post<{ evaluation: TrainingEvaluation }>(`/api/trainings/${trainingId}/evaluate`, { youtubeId: video.youtubeId, videoTitle: video.title, transcript })
        setEvaluation(response.evaluation)
      } catch (evaluationError) {
        setError(evaluationError instanceof ApiError ? evaluationError.message : 'Não foi possível avaliar sua resposta.')
      } finally {
        setEvaluating(false)
      }
    }}>{evaluating ? 'Avaliando resposta...' : 'Avaliar meu conhecimento'}</button>}
    {evaluation && <EvaluationResult evaluation={evaluation} />}
    {error && <p className="recorder-error" role="alert">{error}</p>}
  </section>
}

type TrainingEvaluation = {
  pontuacao: number
  resumo: string
  etapas: { etapa: string; status: 'compreendido' | 'parcial' | 'nao_mencionado' | 'incorreto'; justificativa: string }[]
  pontos_melhoria: string[]
  feedback: string
}

function EvaluationResult({ evaluation }: { evaluation: TrainingEvaluation }) {
  const statusLabels = { compreendido: 'Compreendido', parcial: 'Parcial', nao_mencionado: 'Não mencionado', incorreto: 'Incorreto' }
  return <div className="evaluation-result">
    <div className="evaluation-result-heading"><div><p className="eyebrow">Resultado da avaliação</p><h3>Seu conhecimento</h3></div><strong>{Math.round(evaluation.pontuacao)}%</strong></div>
    <p className="evaluation-summary">{evaluation.resumo}</p>
    <div className="evaluation-steps">{evaluation.etapas.map((step, index) => <div className="evaluation-step" key={`${step.etapa}-${index}`}><div><strong>{step.etapa}</strong><p>{step.justificativa}</p></div><span className={`evaluation-status ${step.status}`}>{statusLabels[step.status]}</span></div>)}</div>
    {evaluation.pontos_melhoria.length > 0 && <div className="evaluation-improvements"><strong>Pontos para melhorar</strong><ul>{evaluation.pontos_melhoria.map(point => <li key={point}>{point}</li>)}</ul></div>}
    <p className="evaluation-feedback"><strong>Feedback:</strong> {evaluation.feedback}</p>
  </div>
}

function CourseDetail({ course, go, notify, canEdit, onUpdate, onBack }: { course: Course; go: (page: Page) => void; notify: (message: string) => void; canEdit: boolean; onUpdate: (course: Course) => Promise<void>; onBack: () => void }) {
  const [activeVideo, setActiveVideo] = useState(0)
  const currentVideo = course.videos[activeVideo]
  return <>
    <div className="course-back"><button className="text-button" onClick={onBack}>← Voltar para meus treinamentos</button></div>
    <section className="course-hero">
      <div className="course-hero-copy">
        <p className="eyebrow">{course.area}</p>
        <h2>{course.title}</h2>
        <p>{course.description}</p>
        <div className="course-meta">
          <span><small>Instrutor</small><strong>{course.instructor}</strong></span>
          <span><small>Carga horária</small><strong>{course.duration}</strong></span>
          <span><small>Aulas em vídeo</small><strong>{course.videos.length}</strong></span>
          <Status value={course.status} />
        </div>
        <div className="course-progress"><div><strong>{course.progress}% concluído</strong><ProgressBar value={course.progress} /></div></div>
      </div>
    </section>
    <div className="course-layout">
      <div className="course-main">
        <section className="panel course-player">
          <div className="course-video">
            <iframe
              className="course-video-frame"
              src={`https://www.youtube.com/embed/${currentVideo.youtubeId}`}
              title={currentVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="course-video-caption">
            <div><strong>{currentVideo.title}</strong><small>Aula {activeVideo + 1} de {course.videos.length} • {currentVideo.duration}</small></div>
            <a className="small-button ghost" href={`https://www.youtube.com/watch?v=${currentVideo.youtubeId}`} target="_blank" rel="noreferrer">Abrir no YouTube</a>
          </div>
          <div className="course-video-actions">
            <button className="secondary" onClick={() => notify(`Aula "${currentVideo.title}" marcada como concluída`)}>Marcar como concluída</button>
          </div>
          <KnowledgeRecorder key={currentVideo.youtubeId} trainingId={course.id} video={currentVideo} />
        </section>
        <section className="panel course-lessons">
          <div className="section-heading"><div><p className="eyebrow">Conteúdo do curso</p><h3>Aulas em vídeo</h3></div></div>
          <div className="lesson-list">
            {course.videos.map((video, index) => <button key={video.title} className={index === activeVideo ? 'lesson-row active' : 'lesson-row'} onClick={() => { setActiveVideo(index); notify(`Aula selecionada: ${video.title}`) }}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{video.title}</strong><small>{index < 2 ? 'Assistida' : 'Aula em vídeo'}</small></div><span className="muted">{video.duration}</span><span className="lesson-state">{index === activeVideo ? '▶' : '○'}</span></button>)}
          </div>
        </section>
      </div>
      <aside className="course-side">
        <section className="panel course-support">
          <div className="section-heading"><div><p className="eyebrow">Materiais de apoio</p><h3>Consulte também</h3></div></div>
          <button className="support-card" onClick={() => go('pops')}><span className="support-icon">⚙</span><div><strong>POPs do curso</strong><small>{course.pops.length} procedimentos vinculados</small></div><span>→</span></button>
          <button className="support-card" onClick={() => go('products')}><span className="support-icon">▤</span><div><strong>Fichas técnicas</strong><small>{course.fichas.length} fichas relacionadas</small></div><span>→</span></button>
        </section>
        <section className="panel course-support">
          <div className="section-heading"><div><p className="eyebrow">POPs</p><h3>Procedimentos do curso</h3></div></div>
          <div className="support-list">
            {course.pops.map(pop => <button key={pop.title} className="support-row" onClick={() => go('pops')}><div><strong>{pop.title}</strong><small>{pop.description}</small></div><span>→</span></button>)}
          </div>
          <button className="text-button" onClick={() => go('pops')}>Ver todos os POPs →</button>
        </section>
        <section className="panel course-support">
          <div className="section-heading"><div><p className="eyebrow">Fichas técnicas</p><h3>Produtos do curso</h3></div></div>
          <div className="support-list">
            {course.fichas.map(ficha => <button key={ficha.title} className="support-row" onClick={() => go('products')}><div><strong>{ficha.title}</strong><small>{ficha.category}</small></div><span>→</span></button>)}
          </div>
          <button className="text-button" onClick={() => go('products')}>Ver todas as fichas →</button>
        </section>
      </aside>
    </div>
  </>
}

function Progress() {
  return <><div className="page-intro"><div><p className="eyebrow">Visão geral</p><h2>Meu progresso</h2><p>Veja como sua jornada está evoluindo em cada área.</p></div></div><div className="progress-cards"><article className="panel donut-card"><div className="donut" style={{ '--value': '68%' } as React.CSSProperties}><span>68%</span></div><div><h3>Conhecimento</h3><p>Você concluiu 68% dos conteúdos disponíveis.</p></div></article><article className="panel donut-card"><div className="donut light" style={{ '--value': '54%' } as React.CSSProperties}><span>54%</span></div><div><h3>Habilidade</h3><p>Você concluiu 54% das práticas avaliadas.</p></div></article></div><section className="panel"><div className="section-heading"><div><p className="eyebrow">Desempenho por área</p><h3>Evolução por área</h3></div></div>{[['Cozinha', 65], ['Atendimento', 30], ['Higienização', 100], ['Segurança alimentar', 0]].map(([label, value]) => <div className="bar-row" key={label as string}><strong>{label}</strong><ProgressBar value={value as number} /><b>{value}%</b></div>)}</section></>
}

function Assessments({ notify }: { notify: (message: string) => void }) { return <ListPage eyebrow="Avalie seu desempenho" title="Avaliações" description="Consulte suas avaliações teóricas e práticas." tabs={['Todas', 'Pendentes', 'Aprovadas', 'Reprovadas']}><div className="assessment-list">{[['Boas Práticas na Cozinha', 'Quiz', '10/05/2025', 'Aprovado', '9,0'], ['Atendimento no Balcão', 'Prática', '12/05/2025', 'Em análise', '—'], ['Segurança Alimentar', 'Quiz', 'Pendente', 'Pendente', '—']].map(row => <div className="assessment-row" key={row[0]}><div><strong>{row[0]}</strong><small>{row[1]}</small></div><span>{row[2]}</span><Status value={row[3]} /><strong>{row[4]}</strong><button className="small-button ghost" onClick={() => notify('Abrindo resultado da avaliação')}>{row[3] === 'Aprovado' ? 'Ver resultado' : 'Ver detalhes'}</button></div>)}</div></ListPage> }

const certificateCourses = [
  { course: 'Boas Práticas na Cozinha', date: '10/05/2025', hours: '2h 40min' },
  { course: 'Higienização de Utensílios', date: '18/05/2025', hours: '1h 20min' },
  { course: 'Atendimento no Balcão', date: '18/05/2025', hours: '1h 55min' },
]

function Certificates({ notify }: { notify: (message: string) => void }) {
  const { user, activeCompany } = useAuth()
  const [selected, setSelected] = useState<number | null>(null)
  const active = selected === null ? null : certificateCourses[selected]
  return <>
    <ListPage eyebrow="Conquistas desbloqueadas" title="Certificados" description="Seus certificados ficam disponíveis após a aprovação teórica e prática.">
      <div className="info-banner"><span>i</span><div><strong>Certificados gerados automaticamente</strong><p>Complete as duas etapas de cada treinamento para liberar seu certificado.</p></div></div>
      <div className="certificate-grid">
        {certificateCourses.map((item, index) => <article className="certificate-card" key={item.course}>
          <span className="certificate-seal">✦</span>
          <div><p className="eyebrow">Certificado de conclusão</p><h3>{item.course}</h3><small>Concluído em {item.date} • {item.hours}</small></div>
          <button className="secondary" onClick={() => setSelected(index)}>Visualizar certificado</button>
        </article>)}
      </div>
    </ListPage>
    {active && <CertificatePreview course={active.course} date={active.date} hours={active.hours} user={user} company={activeCompany} onClose={() => setSelected(null)} notify={notify} />}
  </>
}

function CertificatePreview({ course, date, hours, user, company, onClose, notify }: {
  course: string
  date: string
  hours: string
  user: { nome: string; email: string } | null
  company: { nomeFantasia: string; razaoSocial: string; cnpj: string | null; cargo: string | null } | null
  onClose: () => void
  notify: (message: string) => void
}) {
  const holder = user?.nome ?? 'Colaborador'
  const companyName = company?.nomeFantasia ?? 'Infinity Code'
  const issueDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  return createPortal(<div className="certificate-overlay" role="dialog" aria-modal="true" aria-label="Certificado de conclusão">
    <div className="certificate-modal">
      <div className="certificate-toolbar">
        <div><strong>Prévia do certificado</strong><small>{course}</small></div>
        <div className="certificate-toolbar-actions">
          <button className="secondary" onClick={onClose}>Fechar</button>
          <button className="primary" onClick={() => { notify('Abrindo impressão — escolha "Salvar como PDF"'); window.print() }}>Imprimir / Salvar PDF</button>
        </div>
      </div>
      <div className="certificate-document">
        <div className="certificate-frame">
          <span className="certificate-corner corner-tl" /><span className="certificate-corner corner-tr" />
          <span className="certificate-corner corner-bl" /><span className="certificate-corner corner-br" />
          <div className="certificate-brand">INFINITY<br /><span>CODE</span></div>
          <p className="certificate-kicker">Certificado de conclusão</p>
          <h2 className="certificate-heading">Certificamos que</h2>
          <p className="certificate-name">{holder}</p>
          <p className="certificate-text">concluiu com êxito o treinamento</p>
          <h3 className="certificate-course">{course}</h3>
          <p className="certificate-text certificate-description">
            com carga horária de <strong>{hours}</strong>, promovido por <strong>{companyName}</strong>
            {company?.cnpj ? ` — CNPJ ${company.cnpj}` : ''}.
          </p>
          <div className="certificate-footer">
            <div className="certificate-meta">
              <span><small>Colaborador</small><strong>{user?.email ?? 'colaborador@infinitycode.com'}</strong></span>
              <span><small>Cargo</small><strong>{company?.cargo ?? 'Colaborador'}</strong></span>
              <span><small>Conclusão</small><strong>{date}</strong></span>
              <span><small>Emissão</small><strong>{issueDate}</strong></span>
            </div>
            <div className="certificate-signature">
              <span className="certificate-signature-script">Luiz Eduardo Guarino de Vasconcelos</span>
              <span className="certificate-signature-line" />
              <strong>Luiz Eduardo Guarino de Vasconcelos</strong>
              <small>Diretor</small>
            </div>
          </div>
          <p className="certificate-legal">{company?.razaoSocial ?? 'Infinity Code Desenvolvimento LTDA'} • Certificado emitido eletronicamente pela plataforma Infinity Code.</p>
        </div>
      </div>
    </div>
  </div>, document.body)
}

function Notifications({ notify }: { notify: (message: string) => void }) { const items = [['Novo treinamento atribuído', 'Você recebeu um novo treinamento para realizar.', '20 mai, 09:15'], ['Avaliação prática aprovada', 'Parabéns! Você foi aprovado na avaliação prática.', '19 mai, 14:32'], ['Avaliação prática reprovada', 'Você não foi aprovado na avaliação prática.', '18 mai, 11:07'], ['Lembrete de avaliação próxima', 'Você tem uma avaliação agendada em breve.', '17 mai, 16:45']]; return <ListPage eyebrow="Central de avisos" title="Notificações" description="Acompanhe as novidades da sua jornada."><div className="notification-actions"><div className="tabs"><button className="tab active">Todas</button><button className="tab">Não lidas</button><button className="tab">Lidas</button></div><button className="secondary" onClick={() => notify('Todas as notificações foram marcadas como lidas')}>Marcar todas como lidas</button></div><section className="panel notifications-list">{items.map((item, index) => <div className="notification-row" key={item[0]}><span className={index < 3 ? 'unread-dot' : 'read-dot'} /><div><strong>{item[0]}</strong><p>{item[1]}</p></div><time>{item[2]}</time><span className="muted">›</span></div>)}</section></ListPage> }

function Profile({ notify }: { notify: (message: string) => void }) {
  const { user, activeCompany, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [nome, setNome] = useState(user?.nome ?? '')
  const [telefone, setTelefone] = useState(user?.telefone ?? '')
  const [fotoUrl, setFotoUrl] = useState(user?.fotoUrl ?? null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setError('Escolha uma imagem de até 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setFotoUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!nome.trim()) {
      setError('Informe seu nome.')
      return
    }
    if (telefone && telefone.replace(/\D/g, '').length < 10) {
      setError('Informe um telefone válido com DDD.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateProfile({ nome: nome.trim(), telefone: telefone.trim(), fotoUrl })
      setEditing(false)
      notify('Perfil atualizado com sucesso.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível atualizar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return <><div className="page-intro"><div><p className="eyebrow">Sua conta</p><h2>Meu perfil</h2><p>Gerencie seus dados pessoais, foto e empresa atual.</p></div></div><div className="profile-layout"><div className="profile-side"><div className="profile-avatar">{fotoUrl ? <img src={fotoUrl} alt={`Foto de ${nome}`} /> : initials(nome || 'Usuário')}</div>{editing && <><input ref={fileInput} className="profile-file-input" type="file" accept="image/*" onChange={handlePhoto} /><button className="secondary profile-photo-button" onClick={() => fileInput.current?.click()}>Alterar foto</button>{fotoUrl && <button className="text-button" onClick={() => setFotoUrl(null)}>Remover foto</button>}</>}</div><div className="profile-sections"><section className="panel profile-panel"><div className="section-heading"><h3>Dados pessoais</h3>{editing ? <div className="profile-actions"><button className="secondary" onClick={() => { setEditing(false); setNome(user?.nome ?? ''); setTelefone(user?.telefone ?? ''); setFotoUrl(user?.fotoUrl ?? null); setError('') }}>Cancelar</button><button className="form-submit" disabled={saving} onClick={save}>{saving ? 'Salvando...' : 'Salvar alterações'}</button></div> : <button className="secondary" onClick={() => setEditing(true)}>Editar perfil</button>}</div>{error && <div className="form-alert">{error}</div>}{editing ? <div className="profile-edit-grid"><label className="field"><span>Nome completo</span><input className="input" value={nome} onChange={event => setNome(event.target.value)} /></label><label className="field"><span>Telefone</span><input className="input" value={telefone} onChange={event => setTelefone(event.target.value)} placeholder="(00) 00000-0000" /></label></div> : <><div className="detail-row"><span>Nome</span><strong>{user?.nome}</strong></div><div className="detail-row"><span>E-mail</span><strong>{user?.email}</strong></div><div className="detail-row"><span>Telefone</span><strong>{user?.telefone || 'Não informado'}</strong></div></>}</section><section className="panel profile-panel"><div className="section-heading"><h3>Empresa atual</h3><span className="status ativo">Vínculo ativo</span></div><div className="company-profile-card"><div className="company-profile-logo">{initials(activeCompany?.nomeFantasia ?? 'IC')}</div><div><strong>{activeCompany?.nomeFantasia ?? 'Nenhuma empresa selecionada'}</strong><small>{activeCompany?.razaoSocial ?? 'Selecione uma empresa para visualizar seus dados'}</small></div></div>{activeCompany && <><div className="detail-row"><span>Cargo</span><strong>{activeCompany.cargo || 'Não informado'}</strong></div><div className="detail-row"><span>Permissão</span><strong>{activeCompany.papel}</strong></div><div className="detail-row"><span>CNPJ</span><strong>{activeCompany.cnpj || 'Não informado'}</strong></div></>}</section><section className="panel profile-panel"><div className="section-heading"><h3>Dados de acesso</h3><button className="secondary" onClick={() => notify('Use “Esqueci minha senha” na tela de login para alterar sua senha.')}>Alterar senha</button></div><div className="detail-row"><span>E-mail de acesso</span><strong>{user?.email}</strong></div><div className="detail-row"><span>Senha</span><strong>••••••••</strong></div></section></div></div></>
}

type Material = { id: string; titulo: string; descricao: string | null; tipo: 'POP' | 'FICHA_TECNICA'; versao: number; codigo: string | null; categoria: string | null; rendimento: string | null; conteudo: string | null; ingredientes: string | null; montagemPorcionamento: string | null; conservacao: string | null; urlDocumento: string | null }

function Products({ notify, canManage }: { notify: (message: string) => void; canManage: boolean }) {
  return <MaterialsPage type="FICHA_TECNICA" title="Fichas técnicas dos produtos" eyebrow="Base de conhecimento" description="Selecione um produto para consultar sua ficha técnica." notify={notify} canManage={canManage} />
}

function Pops({ notify, canManage }: { notify: (message: string) => void; canManage: boolean }) {
  return <MaterialsPage type="POP" title="Selecionar POP" eyebrow="Procedimentos operacionais" description="Escolha um procedimento para consultar." notify={notify} canManage={canManage} />
}

type ViewHistoryItem = { id: string; materialId: string; titulo: string; tipo: 'POP' | 'FICHA_TECNICA'; codigo: string | null; categoria: string | null; versao: number; visualizadoEm: string }

function ViewHistory() {
  const [items, setItems] = useState<ViewHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<ViewHistoryItem[]>('/api/history/views').then(setItems).catch(error => {
      setError(error instanceof ApiError ? error.message : 'Não foi possível carregar o histórico.')
    }).finally(() => setLoading(false))
  }, [])

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  }

  return <div className="history-page"><div className="page-intro"><div><p className="eyebrow">Acompanhamento pessoal</p><h2>Histórico de visualizações</h2><p>Consulte os POPs e fichas técnicas que você acessou.</p></div></div>{error && <div className="form-alert material-alert">{error}</div>}{loading ? <section className="panel material-empty">Carregando histórico...</section> : items.length === 0 ? <section className="panel material-empty">Você ainda não visualizou nenhum POP ou ficha técnica.</section> : <section className="panel history-panel"><div className="history-table history-head"><span>Documento</span><span>Tipo</span><span>Categoria</span><span>Versão visualizada</span><span>Data e hora</span></div>{items.map(item => <div className="history-table history-row" key={item.id}><div><strong>{item.titulo}</strong><small>{item.codigo || 'Código não informado'}</small></div><span className="history-type">{item.tipo === 'POP' ? 'POP' : 'Ficha técnica'}</span><span>{item.categoria || 'Não informada'}</span><strong>v{item.versao}</strong><time dateTime={item.visualizadoEm}>{formatDate(item.visualizadoEm)}</time></div>)}</section>}</div>
}

function MaterialsPage({ type, title, eyebrow, description, notify, canManage }: { type: 'POP' | 'FICHA_TECNICA'; title: string; eyebrow: string; description: string; notify: (message: string) => void; canManage: boolean }) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [editingMaterial, setEditingMaterial] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get<Material[]>('/api/materials').then(data => {
      if (active) setMaterials(data.filter(item => item.tipo === type))
    }).catch(error => {
      if (active) setError(error instanceof ApiError ? error.message : 'Não foi possível carregar os materiais.')
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [type])

  function addMaterial(material: Material) {
    setMaterials(current => [material, ...current])
    setShowForm(false)
    notify(`${type === 'POP' ? 'POP' : 'Ficha técnica'} criado com sucesso.`)
  }

  function updateMaterial(material: Material) {
    setMaterials(current => current.map(item => item.id === material.id ? material : item))
    setSelectedMaterial(material)
    setEditingMaterial(false)
    notify(`${type === 'POP' ? 'POP' : 'Ficha técnica'} atualizado com sucesso.`)
  }

  async function openMaterial(material: Material) {
    try {
      await api.post(`/api/history/views/${material.id}`, {})
      setSelectedMaterial(material)
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Não foi possível registrar a visualização.')
    }
  }

  if (selectedMaterial) {
    return editingMaterial
      ? <MaterialForm type={type} initialMaterial={selectedMaterial} onCreated={updateMaterial} onError={setError} onCancel={() => setEditingMaterial(false)} />
      : <MaterialViewer material={selectedMaterial} type={type} canManage={canManage} onEdit={() => setEditingMaterial(true)} onBack={() => setSelectedMaterial(null)} />
  }

  return <><div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>{canManage && <button className="primary material-create-button" onClick={() => setShowForm(current => !current)}>{showForm ? 'Fechar formulário' : `Criar ${type === 'POP' ? 'POP' : 'ficha técnica'}`} <span>+</span></button>}</div>{showForm && <MaterialForm type={type} onCreated={addMaterial} onError={setError} />}{error && <div className="form-alert material-alert">{error}</div>}{loading ? <section className="panel material-empty">Carregando materiais...</section> : <div className={type === 'POP' ? 'pop-list' : 'product-grid'}>{materials.length ? materials.map(material => <MaterialCard key={material.id} material={material} type={type} onOpen={openMaterial} />) : <section className="panel material-empty">Nenhum {type === 'POP' ? 'POP' : 'ficha técnica'} cadastrado para esta empresa.</section>}</div>}</>
}

function MaterialForm({ type, initialMaterial, onCreated, onError, onCancel }: { type: 'POP' | 'FICHA_TECNICA'; initialMaterial?: Material; onCreated: (material: Material) => void; onError: (message: string) => void; onCancel?: () => void }) {
  const [form, setForm] = useState({ titulo: initialMaterial?.titulo ?? '', codigo: initialMaterial?.codigo ?? '', categoria: initialMaterial?.categoria ?? '', rendimento: initialMaterial?.rendimento ?? '', descricao: initialMaterial?.descricao ?? '', conteudo: initialMaterial?.conteudo ?? '', ingredientes: initialMaterial?.ingredientes ?? '', montagemPorcionamento: initialMaterial?.montagemPorcionamento ?? '', conservacao: initialMaterial?.conservacao ?? '', urlDocumento: initialMaterial?.urlDocumento ?? '' })
  const [saving, setSaving] = useState(false)
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.titulo.trim() || !form.codigo.trim() || !form.categoria.trim() || !form.conteudo.trim()) {
      onError('Informe título, código, categoria e conteúdo.')
      return
    }
    setSaving(true)
    try {
      const data = initialMaterial
        ? await api.put<{ material: Material }>(`/api/materials/${initialMaterial.id}`, { ...form })
        : await api.post<{ material: Material }>('/api/materials', { ...form, tipo: type })
      onCreated(data.material)
    } catch (error) {
      onError(error instanceof ApiError ? error.message : 'Não foi possível criar o material.')
    } finally { setSaving(false) }
  }
  return <form className="panel material-form" onSubmit={submit}><div className="section-heading"><div><p className="eyebrow">Área administrativa</p><h3>{initialMaterial ? 'Editar' : 'Novo'} {type === 'POP' ? 'POP' : 'ficha técnica'}</h3></div></div><div className="material-form-grid"><label className="field"><span>Título</span><input className="input" value={form.titulo} onChange={event => update('titulo', event.target.value)} /></label><label className="field"><span>Código</span><input className="input" value={form.codigo} onChange={event => update('codigo', event.target.value)} /></label><label className="field"><span>Categoria</span><input className="input" value={form.categoria} onChange={event => update('categoria', event.target.value)} placeholder={type === 'POP' ? 'Ex.: Higienização' : 'Ex.: Salgados'} /></label>{type === 'FICHA_TECNICA' && <label className="field"><span>Rendimento</span><input className="input" value={form.rendimento} onChange={event => update('rendimento', event.target.value)} placeholder="Ex.: 25 unidades" /></label>}<label className="field field-wide"><span>Descrição</span><input className="input" value={form.descricao} onChange={event => update('descricao', event.target.value)} /></label><label className="field field-wide"><span>{type === 'POP' ? 'Procedimento' : 'Especificações'}</span><textarea className="input material-textarea" value={form.conteudo} onChange={event => update('conteudo', event.target.value)} rows={5} /></label>{type === 'FICHA_TECNICA' && <><label className="field field-wide"><span>Ingredientes</span><textarea className="input material-textarea" value={form.ingredientes} onChange={event => update('ingredientes', event.target.value)} rows={4} placeholder="Um ingrediente por linha" /></label><label className="field"><span>Montagem e porcionamento</span><textarea className="input material-textarea" value={form.montagemPorcionamento} onChange={event => update('montagemPorcionamento', event.target.value)} rows={4} /></label><label className="field"><span>Conservação</span><textarea className="input material-textarea" value={form.conservacao} onChange={event => update('conservacao', event.target.value)} rows={4} /></label></>}<label className="field field-wide"><span>Link do documento <small>(opcional)</small></span><input className="input" type="url" value={form.urlDocumento} onChange={event => update('urlDocumento', event.target.value)} placeholder="https://..." /></label></div><div className="form-actions">{onCancel && <button className="secondary" type="button" onClick={onCancel}>Cancelar</button>}<button className="form-submit" type="submit" disabled={saving}>{saving ? 'Salvando...' : initialMaterial ? 'Salvar alterações' : 'Salvar material'} <span>→</span></button></div></form>
}

function MaterialCard({ material, type, onOpen }: { material: Material; type: 'POP' | 'FICHA_TECNICA'; onOpen: (material: Material) => void }) {
  return <article className={type === 'POP' ? 'pop-card' : 'product-card'}><div className="product-image">{type === 'POP' ? '✧' : '♨'}</div><div className="product-name"><strong>{material.titulo}</strong><small>{material.codigo} · {material.descricao || 'Sem descrição'}</small></div><div><small>Versão</small><strong>v{material.versao}</strong></div><div><small>Conteúdo</small><strong>{material.conteudo ? `${material.conteudo.slice(0, 38)}${material.conteudo.length > 38 ? '...' : ''}` : '—'}</strong></div><Status value="Ativa" /><button className="small-button ghost" onClick={() => onOpen(material)}>{material.urlDocumento ? 'Abrir documento' : 'Ver detalhes'}</button></article>
}

function MaterialViewer({ material, type, canManage, onEdit, onBack }: { material: Material; type: 'POP' | 'FICHA_TECNICA'; canManage: boolean; onEdit: () => void; onBack: () => void }) {
  const isPop = type === 'POP'
  return <div className="material-detail" aria-labelledby="material-detail-title">
    <div className="material-detail-header">
      <div><p className="eyebrow">{isPop ? 'Procedimento operacional padrão' : 'Ficha técnica do produto'}</p><h2 id="material-detail-title">{material.titulo}</h2><Status value="Ativa" /></div>
      <div className="material-detail-actions">{canManage && <button className="secondary" onClick={onEdit}>Editar {isPop ? 'POP' : 'ficha'}</button>}{material.urlDocumento && <a className="secondary" href={material.urlDocumento} target="_blank" rel="noreferrer">Abrir documento <span>↗</span></a>}<button className="primary" onClick={onBack}>← Voltar para {isPop ? 'POPs' : 'produtos'}</button></div>
    </div>
    <section className="panel material-info-panel"><h3>Informações gerais</h3><div className="material-info-grid">{!isPop && <MaterialInfo icon="◉" label="Rendimento" value={material.rendimento || 'Não informado'} />}<MaterialInfo icon="⌑" label="Código" value={material.codigo || 'Não informado'} /><MaterialInfo icon="◇" label="Categoria" value={material.categoria || 'Não informada'} /><MaterialInfo icon="◷" label="Versão" value={`v${material.versao}`} /><MaterialInfo icon="▣" label="Tipo" value={isPop ? 'POP' : 'Ficha técnica'} /><MaterialInfo icon="✓" label="Status" value="Ativa" /></div></section>
    <div className="material-detail-grid">
      <section className="panel material-detail-card"><h3>{isPop ? 'Objetivo do procedimento' : 'Descrição do produto'}</h3><div className="material-detail-icon">{isPop ? '◎' : '♨'}</div><p>{material.descricao || 'Nenhuma descrição informada.'}</p></section>
      <section className="panel material-detail-card"><h3>{isPop ? 'Modo de fazer' : 'Especificações técnicas'}</h3><div className="material-detail-icon">{isPop ? '☷' : '≡'}</div><div className="material-detail-content">{material.conteudo || 'Nenhum conteúdo informado.'}</div></section>
      {!isPop && <><section className="panel material-detail-card"><h3>Ingredientes</h3><div className="material-detail-icon">♧</div><div className="material-detail-content">{material.ingredientes || 'Nenhum ingrediente informado.'}</div></section><section className="panel material-detail-card"><h3>Montagem e porcionamento</h3><div className="material-detail-icon">⚖</div><div className="material-detail-content">{material.montagemPorcionamento || 'Nenhuma informação de montagem e porcionamento.'}</div></section><section className="panel material-detail-card"><h3>Conservação</h3><div className="material-detail-icon">▣</div><div className="material-detail-content">{material.conservacao || 'Nenhuma informação de conservação.'}</div></section></>}
    </div>
    <section className="panel material-observations"><div className="material-detail-icon">✎</div><div><h3>Observações</h3><p>{material.urlDocumento ? 'Consulte também o documento completo para mais informações.' : 'Nenhuma observação adicional informada.'}</p></div></section>
  </div>
}

function MaterialInfo({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="material-info-item"><span className="material-info-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>
}

function ListPage({ eyebrow, title, description, tabs, children }: { eyebrow: string; title: string; description: string; tabs?: string[]; children: React.ReactNode }) { return <><div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div></div>{tabs && <div className="tabs">{tabs.map((tab, index) => <button className={index === 0 ? 'tab active' : 'tab'} key={tab}>{tab}</button>)}</div>}{children}</> }

function Splash() {
  return <div className="auth-splash"><div className="brand">INFINITY<br /><span>CODE</span></div><p>Carregando sua sessão...</p></div>
}

function AppRouter() {
  const pathname = usePathname()
  const { user, companies, activeCompany, loading, canManage } = useAuth()

  if (loading) return <Splash />

  if (pathname === '/login') {
    if (user) return <Redirect to={activeCompany ? '/dashboard' : '/select-company'} />
    return <LoginPage />
  }
  if (pathname === '/register') {
    if (user) return <Redirect to={activeCompany ? '/dashboard' : '/select-company'} />
    return <RegisterCompanyPage />
  }

  if (pathname === '/forgot-password') return <ForgotPasswordPage />
  if (pathname === '/reset-password') return <ResetPasswordPage />

  if (pathname === '/select-company') {
    if (!user) return <Redirect to="/login" />
    return <SelectCompanyPage />
  }

  if (pathname === '/') return <PlatformApp initialPage="landing" />

  if (!user) return <Redirect to="/login" />
  if (!activeCompany && companies.length > 1) return <Redirect to="/select-company" />

  if (pathname === '/admin/collaborators/new') {
    if (!canManage) return <Redirect to="/dashboard" />
    return <PlatformApp key={pathname} initialPage="collaborators" />
  }

  return <PlatformApp key={pathname} initialPage="dashboard" />
}

function App() {
  return <AuthProvider><AppRouter /></AuthProvider>
}

export default App
