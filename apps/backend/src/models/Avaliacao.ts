import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class Avaliacao extends Model<InferAttributes<Avaliacao>, InferCreationAttributes<Avaliacao>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare atribuicaoId: bigint | null
  declare usuarioId: bigint
  declare trilhaId: bigint
  declare materialId: bigint
  declare pontuacao: number
  declare transcricao: string
  declare resultado: object
  declare criadoEm: CreationOptional<Date>
}

Avaliacao.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  atribuicaoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'atribuicao_id' },
  usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'usuario_id' },
  trilhaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'trilha_id' },
  materialId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'material_id' },
  pontuacao: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  transcricao: { type: DataTypes.TEXT('long'), allowNull: false },
  resultado: { type: DataTypes.JSON, allowNull: false },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { sequelize, tableName: 'avaliacao', timestamps: false })
