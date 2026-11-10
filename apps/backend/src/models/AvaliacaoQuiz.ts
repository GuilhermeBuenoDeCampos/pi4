import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class AvaliacaoQuiz extends Model<InferAttributes<AvaliacaoQuiz>, InferCreationAttributes<AvaliacaoQuiz>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare usuarioId: bigint
  declare trilhaId: string | null
  declare trilhaTitulo: string
  declare pontuacao: number
  declare acertos: number
  declare total: number
  declare aprovado: CreationOptional<boolean>
  declare respostas: unknown
  declare criadoEm: CreationOptional<Date>
}

AvaliacaoQuiz.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'usuario_id' },
  trilhaId: { type: DataTypes.STRING(120), allowNull: true, field: 'trilha_id' },
  trilhaTitulo: { type: DataTypes.STRING(200), allowNull: false, field: 'trilha_titulo' },
  pontuacao: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  acertos: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  total: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  aprovado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  respostas: { type: DataTypes.JSON, allowNull: true },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, {
  sequelize,
  tableName: 'avaliacao_quiz',
  timestamps: false,
  indexes: [{ name: 'idx_aval_empresa_usuario', fields: ['empresaId', 'usuarioId', 'criadoEm'] }],
})
