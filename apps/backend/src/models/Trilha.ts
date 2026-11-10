import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class Trilha extends Model<InferAttributes<Trilha>, InferCreationAttributes<Trilha>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare titulo: string
  declare descricao: string | null
  declare area: string | null
  declare instrutor: string | null
  declare duracao: string | null
  declare quiz: unknown
  declare obrigatoria: CreationOptional<boolean>
  declare ativa: CreationOptional<boolean>
  declare criadoEm: CreationOptional<Date>
}

Trilha.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  titulo: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  area: { type: DataTypes.STRING(120), allowNull: true },
  instrutor: { type: DataTypes.STRING(200), allowNull: true },
  duracao: { type: DataTypes.STRING(60), allowNull: true },
  quiz: { type: DataTypes.JSON, allowNull: true },
  obrigatoria: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ativa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { sequelize, tableName: 'trilha', timestamps: false })
