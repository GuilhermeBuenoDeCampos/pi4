import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class AvaliacaoPratica extends Model<InferAttributes<AvaliacaoPratica>, InferCreationAttributes<AvaliacaoPratica>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare usuarioId: bigint
  declare avaliadorId: bigint
  declare trilhaId: string | null
  declare trilhaTitulo: string
  declare pontuacao: number
  declare aprovado: CreationOptional<boolean>
  declare itens: unknown
  declare observacoes: string | null
  declare criadoEm: CreationOptional<Date>
}

AvaliacaoPratica.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'usuario_id' },
  avaliadorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'avaliador_id' },
  trilhaId: { type: DataTypes.STRING(120), allowNull: true, field: 'trilha_id' },
  trilhaTitulo: { type: DataTypes.STRING(200), allowNull: false, field: 'trilha_titulo' },
  pontuacao: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  aprovado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  itens: { type: DataTypes.JSON, allowNull: false },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, {
  sequelize,
  tableName: 'avaliacao_pratica',
  timestamps: false,
  indexes: [{ name: 'idx_aval_pratica_empresa_usuario', fields: ['empresa_id', 'usuario_id', 'criado_em'] }],
})
