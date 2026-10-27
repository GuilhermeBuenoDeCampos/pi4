import 'dotenv/config'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { resolve } from 'node:path'

const execFileAsync = promisify(execFile)
const schemaPath = resolve(process.cwd(), '..', '..', 'onboarding_mysql.sql')
const args = [
  '--host', process.env.DB_HOST ?? '127.0.0.1',
  '--port', process.env.DB_PORT ?? '3306',
  '--user', process.env.DB_USER ?? 'root',
]

if (process.env.DB_PASSWORD) {
  args.push(`--password=${process.env.DB_PASSWORD}`)
}

try {
  const schema = await readFile(schemaPath, 'utf8')
  const result = await execFileAsync('mysql', [...args, '--execute', schema], { maxBuffer: 1024 * 1024 * 5 })
  if (result.stdout) console.log(result.stdout)
  console.log('Schema onboarding_corporativo aplicado com sucesso.')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Não foi possível aplicar o schema MySQL: ${message}`)
  console.error('Verifique se o MySQL está em execução, se o cliente mysql está no PATH e se DB_HOST/DB_PORT/DB_USER/DB_PASSWORD estão corretos.')
  process.exitCode = 1
}
