import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import mysql from 'mysql2/promise'

const schemaPath = resolve(process.cwd(), '..', '..', 'onboarding_mysql.sql')
const databaseName = process.env.DB_NAME ?? 'onboarding_corporativo'

try {
  const schema = await readFile(schemaPath, 'utf8')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    multipleStatements: true,
  })

  const [databases] = await connection.query(
    'SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = ?',
    [databaseName],
  ) as [{ SCHEMA_NAME: string }[], unknown]
  if (!databases.length) {
    await connection.query(schema)
  }
  await connection.query(`USE \`${databaseName.replace(/`/g, '``')}\``)
  const [columns] = await connection.query(
    `SELECT COUNT(*) AS total FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'usuario' AND column_name = 'foto_url'`,
  ) as [{ total: number }[], unknown]
  if (Number(columns[0]?.total ?? 0) === 0) {
    await connection.query('ALTER TABLE usuario ADD COLUMN foto_url LONGTEXT NULL AFTER telefone')
  }
  const fichaColumns = [
    ['categoria', "VARCHAR(100) NOT NULL DEFAULT 'Geral'"],
    ['rendimento', 'VARCHAR(120) NULL'],
    ['ingredientes', 'LONGTEXT NULL'],
    ['montagem_porcionamento', 'LONGTEXT NULL'],
    ['conservacao', 'LONGTEXT NULL'],
  ] as const
  for (const [column, definition] of fichaColumns) {
    const [existing] = await connection.query(
      `SELECT COUNT(*) AS total FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'ficha_tecnica' AND column_name = ?`,
      [column],
    ) as [{ total: number }[], unknown]
    if (Number(existing[0]?.total ?? 0) === 0) {
      await connection.query(`ALTER TABLE ficha_tecnica ADD COLUMN ${column} ${definition}`)
    }
  }
  const [popCategory] = await connection.query(
    `SELECT COUNT(*) AS total FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'pop' AND column_name = 'categoria'`,
  ) as [{ total: number }[], unknown]
  if (Number(popCategory[0]?.total ?? 0) === 0) {
    await connection.query("ALTER TABLE pop ADD COLUMN categoria VARCHAR(100) NOT NULL DEFAULT 'Geral' AFTER codigo")
  }
  const trilhaColumns = [
    ['area', 'VARCHAR(120) NULL'],
    ['instrutor', 'VARCHAR(200) NULL'],
    ['duracao', 'VARCHAR(60) NULL'],
  ] as const
  for (const [column, definition] of trilhaColumns) {
    const [existing] = await connection.query(
      `SELECT COUNT(*) AS total FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'trilha' AND column_name = ?`,
      [column],
    ) as [{ total: number }[], unknown]
    if (Number(existing[0]?.total ?? 0) === 0) {
      await connection.query(`ALTER TABLE trilha ADD COLUMN ${column} ${definition}`)
    }
    const [videoTranscript] = await connection.query(
      `SELECT COUNT(*) AS total FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'video' AND column_name = 'transcricao'`,
    ) as [{ total: number }[], unknown]
    if (Number(videoTranscript[0]?.total ?? 0) === 0) {
      await connection.query('ALTER TABLE video ADD COLUMN transcricao LONGTEXT NULL AFTER duracao_segundos')
    }
  }
  await connection.query(`
    CREATE TABLE IF NOT EXISTS historico_visualizacao (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id BIGINT UNSIGNED NOT NULL,
      empresa_id BIGINT UNSIGNED NOT NULL,
      material_id BIGINT UNSIGNED NOT NULL,
      versao INT UNSIGNED NOT NULL,
      visualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_historico_usuario_empresa (usuario_id, empresa_id, visualizado_em),
      CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
      CONSTRAINT fk_historico_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE,
      CONSTRAINT fk_historico_material FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `)
  await connection.end()
  console.log('Schema onboarding_corporativo aplicado com sucesso.')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Não foi possível aplicar o schema MySQL: ${message}`)
  console.error('Verifique se o MySQL está em execução e se DB_HOST/DB_PORT/DB_USER/DB_PASSWORD estão corretos.')
  process.exitCode = 1
}
