import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export type StatusAtribuicao = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'

export class Atribuicao extends Model<InferAttributes<Atribuicao>, InferCreationAttributes<Atribuicao>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare empresaUsuarioId: bigint
  declare trilhaId: bigint
  declare atribuidoPor: bigint | null
  declare dataInicio: CreationOptional<Date>
  declare prazo: Date | null
  declare status: CreationOptional<StatusAtribuicao>
}

Atribuicao.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  empresaUsuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_usuario_id' },
  trilhaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'trilha_id' },
  atribuidoPor: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'atribuido_por' },
  dataInicio: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'data_inicio' },
  prazo: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'), allowNull: false, defaultValue: 'PENDENTE' },
}, { sequelize, tableName: 'atribuicao', timestamps: false })
