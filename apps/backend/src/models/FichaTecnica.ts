import { DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class FichaTecnica extends Model<InferAttributes<FichaTecnica>, InferCreationAttributes<FichaTecnica>> {
  declare materialId: bigint
  declare codigo: string
  declare especificacoes: string | null
  declare urlDocumento: string | null
}

FichaTecnica.init({
  materialId: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, field: 'material_id' },
  codigo: { type: DataTypes.STRING(60), allowNull: false },
  especificacoes: { type: DataTypes.TEXT('long'), allowNull: true },
  urlDocumento: { type: DataTypes.STRING(2048), allowNull: true, field: 'url_documento' },
}, { sequelize, tableName: 'ficha_tecnica', timestamps: false })
