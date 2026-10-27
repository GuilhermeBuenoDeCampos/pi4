import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export type TipoTokenSenha = 'RESET' | 'CONVITE'

export class TokenSenha extends Model<InferAttributes<TokenSenha>, InferCreationAttributes<TokenSenha>> {
  declare id: CreationOptional<bigint>
  declare usuarioId: bigint
  declare tokenHash: string
  declare tipo: CreationOptional<TipoTokenSenha>
  declare expiraEm: Date
  declare usadoEm: Date | null
  declare criadoEm: CreationOptional<Date>
}

TokenSenha.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'usuario_id' },
  tokenHash: { type: DataTypes.CHAR(64), allowNull: false, field: 'token_hash' },
  tipo: { type: DataTypes.ENUM('RESET', 'CONVITE'), allowNull: false, defaultValue: 'RESET' },
  expiraEm: { type: DataTypes.DATE, allowNull: false, field: 'expira_em' },
  usadoEm: { type: DataTypes.DATE, allowNull: true, field: 'usado_em' },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { sequelize, tableName: 'token_senha', timestamps: false, indexes: [{ name: 'idx_token_senha_hash', fields: ['token_hash'] }] })
