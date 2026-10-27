import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class TrilhaMaterial extends Model<InferAttributes<TrilhaMaterial>, InferCreationAttributes<TrilhaMaterial>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare trilhaId: bigint
  declare materialId: bigint
  declare ordem: number
  declare obrigatorio: CreationOptional<boolean>
}

TrilhaMaterial.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  trilhaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'trilha_id' },
  materialId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'material_id' },
  ordem: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  obrigatorio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { sequelize, tableName: 'trilha_material', timestamps: false, indexes: [
  { unique: true, name: 'uk_trilha_material', fields: ['trilha_id', 'material_id'] },
  { unique: true, name: 'uk_trilha_ordem', fields: ['trilha_id', 'ordem'] },
] })
