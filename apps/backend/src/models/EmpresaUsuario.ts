import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export type Papel = 'ADMIN' | 'GESTOR' | 'INSTRUTOR' | 'COLABORADOR'
export type StatusVinculo = 'ATIVO' | 'INATIVO' | 'CONVIDADO'

export class EmpresaUsuario extends Model<InferAttributes<EmpresaUsuario>, InferCreationAttributes<EmpresaUsuario>> {
  declare id: CreationOptional<bigint>
  declare empresaId: bigint
  declare usuarioId: bigint
  declare cargoId: bigint | null
  declare papel: CreationOptional<Papel>
  declare status: CreationOptional<StatusVinculo>
  declare dataEntrada: Date | null
  declare criadoEm: CreationOptional<Date>
}

EmpresaUsuario.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'usuario_id' },
  cargoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'cargo_id' },
  papel: { type: DataTypes.ENUM('ADMIN', 'GESTOR', 'INSTRUTOR', 'COLABORADOR'), allowNull: false, defaultValue: 'COLABORADOR' },
  status: { type: DataTypes.ENUM('ATIVO', 'INATIVO', 'CONVIDADO'), allowNull: false, defaultValue: 'CONVIDADO' },
  dataEntrada: { type: DataTypes.DATEONLY, allowNull: true, field: 'data_entrada' },
  criadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { sequelize, tableName: 'empresa_usuario', timestamps: false, indexes: [{ unique: true, name: 'uk_vinculo_empresa_usuario', fields: ['empresa_id', 'usuario_id'] }] })
