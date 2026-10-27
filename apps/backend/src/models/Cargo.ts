import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class Cargo extends Model<InferAttributes<Cargo>, InferCreationAttributes<Cargo>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare nome: string
  declare descricao: string | null
}

Cargo.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  nome: { type: DataTypes.STRING(120), allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, tableName: 'cargo', timestamps: false, indexes: [{ unique: true, name: 'uk_cargo_empresa_nome', fields: ['empresa_id', 'nome'] }] })
