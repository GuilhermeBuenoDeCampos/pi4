import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class Usuario extends Model<InferAttributes<Usuario>, InferCreationAttributes<Usuario>> {
  declare id: CreationOptional<bigint>
  declare nome: string
  declare email: string
  declare telefone: string | null
  declare senhaHash: string
  declare ativo: CreationOptional<boolean>
  declare criadoEm: CreationOptional<Date>
  declare atualizadoEm: CreationOptional<Date>
}

Usuario.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: 'uk_usuario_email' },
  telefone: { type: DataTypes.STRING(20), allowNull: true },
  senhaHash: { type: DataTypes.STRING(255), allowNull: false, field: 'senha_hash' },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
  atualizadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'atualizado_em' },
}, { sequelize, tableName: 'usuario', updatedAt: 'atualizadoEm', createdAt: 'criadoEm' })
