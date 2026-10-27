import { DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class Video extends Model<InferAttributes<Video>, InferCreationAttributes<Video>> {
  declare materialId: bigint
  declare url: string
  declare duracaoSegundos: number | null
}

Video.init({
  materialId: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, field: 'material_id' },
  url: { type: DataTypes.STRING(2048), allowNull: false },
  duracaoSegundos: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'duracao_segundos' },
}, { sequelize, tableName: 'video', timestamps: false })
