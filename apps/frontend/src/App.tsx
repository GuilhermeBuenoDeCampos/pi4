import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { navigate, Redirect, usePathname } from './router'
import { LoginPage } from './pages/LoginPage'
import { SelectCompanyPage } from './pages/SelectCompanyPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { NewCollaboratorPage } from './pages/NewCollaboratorPage'

type Page = 'landing' | 'dashboard' | 'trainings' | 'course' | 'progress' | 'assessments' | 'certificates' | 'notifications' | 'profile' | 'products' | 'pops' | 'collaborators'

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
]

type CourseVideo = { title: string; duration: string; youtubeId: string }
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
  const { user, canManage, logout } = useAuth()
  const [page, setPage] = useState<Page>(initialPage)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const selectedCourse = trainings.find(course => course.id === courseId) ?? null
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
        {page === 'dashboard' && <Dashboard go={go} openCourse={openCourse} />}
        {page === 'trainings' && <Trainings go={go} notify={notify} openCourse={openCourse} />}
        {page === 'course' && selectedCourse && <CourseDetail course={selectedCourse} go={go} notify={notify} onBack={() => setPage('trainings')} />}
        {page === 'progress' && <Progress />}
        {page === 'assessments' && <Assessments notify={notify} />}
        {page === 'certificates' && <Certificates notify={notify} />}
        {page === 'notifications' && <Notifications notify={notify} />}
        {page === 'profile' && <Profile notify={notify} />}
        {page === 'products' && <Products notify={notify} />}
        {page === 'pops' && <Pops notify={notify} />}
        {page === 'collaborators' && <NewCollaboratorPage notify={notify} onBack={() => setPage('dashboard')} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function pageTitle(page: Page, courseTitle?: string) {
  const titles: Record<Page, string> = { landing: 'Infinity Code', dashboard: 'Dashboard do funcionário', trainings: 'Meus treinamentos', course: courseTitle ?? 'Detalhes do curso', progress: 'Meu progresso', assessments: 'Avaliações', certificates: 'Certificados', notifications: 'Notificações', profile: 'Meu perfil', products: 'Fichas técnicas dos produtos', pops: 'Selecionar POP', collaborators: 'Colaboradores' }
  return titles[page]
}

function Landing({ go }: { go: (page: Page) => void }) {
  return <div className="landing-page">
    <header className="landing-nav">
      <div className="brand landing-brand">INFINITY<br /><span>CODE</span></div>
      <nav><a href="#solucao">A solução</a><a href="#recursos">Recursos</a><a href="#beneficios">Benefícios</a></nav>
      <button className="landing-login" onClick={() => go('dashboard')}>Acessar plataforma <span>→</span></button>
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
  return <header className="topbar"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="user-chip"><span className="avatar">{initials(userName)}</span><strong>{userName}</strong><span className="chevron">⌄</span></div></header>
}

function Dashboard({ go, openCourse }: { go: (page: Page) => void; openCourse: (id: string) => void }) {
  const { user } = useAuth()
  const firstName = user?.nome.split(' ')[0] ?? 'João'
  return <div className="dashboard-wrap"><Topbar title="Dashboard do funcionário" /><section className="hero"><div><p className="eyebrow">Bom dia, {firstName}</p><h2>Continue evoluindo<br /><em>com propósito.</em></h2><p>Você está a um passo de concluir seus próximos treinamentos.</p><button className="primary" onClick={() => go('trainings')}>Ver meus treinamentos <span>→</span></button></div><div className="hero-art"><div className="ring">68<small>%</small></div><span>progresso geral</span></div></section><div className="metric-grid"><Metric label="Treinamentos em andamento" value="02" caption="Continue de onde parou" icon="▣" /><Metric label="Treinamentos concluídos" value="04" caption="+1 este mês" icon="✓" /><Metric label="Taxa de aprovação" value="86%" caption="Excelente desempenho" icon="↗" /><Metric label="Próxima avaliação" value="22 mai" caption="Boas práticas na cozinha" icon="◷" /></div><section className="panel recent"><div className="section-heading"><div><p className="eyebrow">Sua jornada</p><h3>Últimos treinamentos</h3></div><button className="text-button" onClick={() => go('trainings')}>Ver todos →</button></div><TrainingTable compact onOpen={openCourse} /></section></div>
}

function Metric({ label, value, caption, icon }: { label: string; value: string; caption: string; icon: string }) {
  return <article className="metric-card"><span className="metric-icon">{icon}</span><p>{label}</p><strong>{value}</strong><small>{caption}</small></article>
}

function Trainings({ go, notify, openCourse }: { go: (page: Page) => void; notify: (message: string) => void; openCourse: (id: string) => void }) {
  const [filter, setFilter] = useState('Todos')
  const filters = ['Todos', 'Em andamento', 'Concluídos', 'Pendentes', 'Reprovados']
  const visible = filter === 'Todos' ? trainings : trainings.filter(item => item.status === filter.replace('Concluídos', 'Concluído').replace('Pendentes', 'Pendente'))
  return <><div className="page-intro"><div><p className="eyebrow">Sua trilha de desenvolvimento</p><h2>Meus treinamentos</h2><p>Acompanhe seu progresso e continue aprendendo.</p></div><button className="secondary" onClick={() => notify('Filtros avançados em breve')}>Filtrar resultados</button></div><div className="tabs">{filters.map(item => <button className={filter === item ? 'tab active' : 'tab'} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><section className="panel"><TrainingTable data={visible} go={go} notify={notify} onOpen={openCourse} /></section></>
}

function TrainingTable({ compact = false, data = trainings, go, notify, onOpen }: { compact?: boolean; data?: Course[]; go?: (page: Page) => void; notify?: (message: string) => void; onOpen?: (id: string) => void }) {
  return <div className={compact ? 'data-table compact' : 'data-table'}><div className="table-row table-head"><span>Treinamento</span><span>Área</span><span>Progresso</span><span>Status</span><span>Ações</span></div>{data.map(item => <div className="table-row" key={item.title}><div><strong>{item.title}</strong><small>{item.videos.length} aulas • {item.pops.length} POPs • {item.fichas.length} fichas</small></div><span className="muted">{item.area}</span><div className="progress-cell"><strong>{item.progress}%</strong><ProgressBar value={item.progress} /></div><Status value={item.status} /><div className="actions">{!compact && <button className="small-button" onClick={() => { notify?.(`${item.title} selecionado`); onOpen?.(item.id) }}>{item.progress ? 'Continuar' : 'Iniciar'}</button>}<button className="small-button ghost" onClick={() => onOpen ? onOpen(item.id) : go?.('progress')}>Detalhes</button></div></div>)}</div>
}

function ProgressBar({ value }: { value: number }) { return <div className="progress-bar"><span style={{ width: `${value}%` }} /></div> }
function Status({ value }: { value: string }) { return <span className={`status ${value.toLowerCase().replace(' ', '-')}`}>{value}</span> }

function CourseDetail({ course, go, notify, onBack }: { course: Course; go: (page: Page) => void; notify: (message: string) => void; onBack: () => void }) {
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

function Profile({ notify }: { notify: (message: string) => void }) { return <><div className="page-intro"><div><p className="eyebrow">Sua conta</p><h2>Meu perfil</h2><p>Gerencie seus dados pessoais e informações de acesso.</p></div></div><div className="profile-layout"><div className="profile-avatar">JS</div><div className="profile-sections"><section className="panel profile-panel"><div className="section-heading"><h3>Dados pessoais</h3><button className="secondary" onClick={() => notify('Modo de edição ativado')}>Editar perfil</button></div>{[['Nome', 'João da Silva'], ['E-mail', 'joao.silva@email.com'], ['Cargo', 'Auxiliar de Cozinha'], ['Área', 'Cozinha'], ['Data de admissão', '12/02/2024']].map(row => <div className="detail-row" key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong></div>)}</section><section className="panel profile-panel"><div className="section-heading"><h3>Dados de acesso</h3><button className="secondary" onClick={() => notify('Link para alteração de senha enviado')}>Alterar senha</button></div><div className="detail-row"><span>E-mail de acesso</span><strong>joao.silva@email.com</strong></div><div className="detail-row"><span>Senha</span><strong>••••••••</strong></div></section></div></div></> }

function Products({ notify }: { notify: (message: string) => void }) { return <ListPage eyebrow="Base de conhecimento" title="Fichas técnicas dos produtos" description="Selecione um produto para consultar sua ficha técnica."><div className="product-grid">{[['Pastel de Carne', '25 unidades', '30 minutos', 'Ativa'], ['Pastel de Queijo', '25 unidades', '25 minutos', 'Ativa'], ['Pastel de Frango com Catupiry', '25 unidades', '35 minutos', 'Em revisão'], ['Coxinha de Frango', '30 unidades', '40 minutos', 'Ativa']].map(item => <article className="product-card" key={item[0]}><div className="product-image">♨</div><div className="product-name"><strong>{item[0]}</strong><small>Categoria · Salgados</small></div><div><small>Rendimento</small><strong>{item[1]}</strong></div><div><small>Tempo de preparo</small><strong>{item[2]}</strong></div><Status value={item[3]} /><button className="small-button ghost" onClick={() => notify(`Ficha de ${item[0]} aberta`)}>Abrir ficha</button></article>)}</div></ListPage> }

function Pops({ notify }: { notify: (message: string) => void }) { return <ListPage eyebrow="Procedimentos operacionais" title="Selecionar POP" description="Escolha um procedimento para consultar."><div className="pop-list">{[['Higienização de Utensílios', 'Limpeza e desinfecção dos utensílios', '15 minutos', 'Concluído'], ['Higienização das Mãos', 'Lavagem correta antes e durante a produção', '5 minutos', 'Pendente'], ['Organização da Bancada', 'Preparação e organização do posto de trabalho', '10 minutos', 'Em andamento'], ['Armazenamento de Ingredientes', 'Identificação, validade e conservação dos produtos', '20 minutos', 'Pendente']].map(item => <article className="pop-card" key={item[0]}><div className="product-image">✧</div><div className="product-name"><strong>{item[0]}</strong><small>{item[1]}</small></div><div><small>Responsável</small><strong>Auxiliar de cozinha</strong></div><div><small>Tempo estimado</small><strong>{item[2]}</strong></div><Status value={item[3]} /><button className="small-button ghost" onClick={() => notify(`POP ${item[0]} aberto`)}>Abrir POP</button></article>)}</div></ListPage> }

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
