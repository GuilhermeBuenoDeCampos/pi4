import cors from 'cors'
import express from 'express'
import './models/index.js'

const app = express()
const port = Number(process.env.PORT ?? 3333)

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

app.listen(port, () => {
  console.log(`Infinity Code API running at http://localhost:${port}`)
})
