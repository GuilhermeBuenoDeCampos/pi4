import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export type StatusProgresso = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO'

export class Progresso extends Model<InferAttributes<Progresso>, InferCreationAttributes<Progresso>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare atribuicaoId: bigint
  declare trilhaMaterialId: bigint
  declare status: CreationOptional<StatusProgresso>
  declare percentual: CreationOptional<number>
  declare concluidoEm: Date | null
}

Progresso.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  atribuicaoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'atribuicao_id' },
  trilhaMaterialId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'trilha_material_id' },
  status: { type: DataTypes.ENUM('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO'), allowNull: false, defaultValue: 'NAO_INICIADO' },
  percentual: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0, validate: { min: 0, max: 100 } },
  concluidoEm: { type: DataTypes.DATE, allowNull: true, field: 'concluido_em' },
}, { sequelize, tableName: 'progresso', timestamps: false, indexes: [{ unique: true, name: 'uk_progresso_atr_item', fields: ['atribuicao_id', 'trilha_material_id'] }] })
