import { DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class Pop extends Model<InferAttributes<Pop>, InferCreationAttributes<Pop>> {
  declare materialId: bigint
  declare codigo: string
  declare procedimento: string | null
  declare urlDocumento: string | null
}

Pop.init({
  materialId: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, field: 'material_id' },
  codigo: { type: DataTypes.STRING(60), allowNull: false },
  procedimento: { type: DataTypes.TEXT('long'), allowNull: true },
  urlDocumento: { type: DataTypes.STRING(2048), allowNull: true, field: 'url_documento' },
}, { sequelize, tableName: 'pop', timestamps: false })
