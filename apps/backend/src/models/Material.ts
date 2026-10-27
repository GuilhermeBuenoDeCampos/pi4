import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export type TipoMaterial = 'VIDEO' | 'POP' | 'FICHA_TECNICA'

export class Material extends Model<InferAttributes<Material>, InferCreationAttributes<Material>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare titulo: string
  declare descricao: string | null
  declare tipo: TipoMaterial
  declare versao: CreationOptional<number>
  declare ativo: CreationOptional<boolean>
  declare criadoEm: CreationOptional<Date>
  declare atualizadoEm: CreationOptional<Date>
}

Material.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  titulo: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  tipo: { type: DataTypes.ENUM('VIDEO', 'POP', 'FICHA_TECNICA'), allowNull: false },
  versao: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1, validate: { min: 1 } },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
  atualizadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'atualizado_em' },
}, { sequelize, tableName: 'material', updatedAt: 'atualizadoEm', createdAt: 'criadoEm' })
