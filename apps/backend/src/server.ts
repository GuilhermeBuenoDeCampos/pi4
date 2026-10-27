import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import './models/index.js'
import authRoutes from './routes/auth.js'
import collaboratorRoutes from './routes/collaborators.js'
import { env } from './config/env.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'infinity-code-api' })
})

app.get('/api/dashboard', (_request, response) => {
  response.json({
    user: { name: 'João da Silva', role: 'Auxiliar de Cozinha' },
    metrics: { inProgress: 2, completed: 4, approvalRate: 86, nextEvaluation: '22 mai' },
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin/collaborators', collaboratorRoutes)

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error)
  response.status(500).json({ message: 'Erro interno do servidor.' })
})

app.listen(env.port, () => {
  console.log(`Infinity Code API running at http://localhost:${env.port}`)
})
