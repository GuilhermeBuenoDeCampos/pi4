import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class Empresa extends Model<InferAttributes<Empresa>, InferCreationAttributes<Empresa>> {
  declare id: CreationOptional<bigint>
  declare razaoSocial: string
  declare nomeFantasia: string
  declare cnpj: string | null
  declare ativa: CreationOptional<boolean>
  declare criadoEm: CreationOptional<Date>
}

Empresa.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  razaoSocial: { type: DataTypes.STRING(200), allowNull: false, field: 'razao_social' },
  nomeFantasia: { type: DataTypes.STRING(200), allowNull: false, field: 'nome_fantasia' },
  cnpj: { type: DataTypes.CHAR(14), allowNull: true, unique: 'uk_empresa_cnpj' },
  ativa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { sequelize, tableName: 'empresa', createdAt: 'criadoEm', updatedAt: false })
