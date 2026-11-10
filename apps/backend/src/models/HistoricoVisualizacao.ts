import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize'
import { sequelize } from '../database/sequelize.js'

export class HistoricoVisualizacao extends Model<InferAttributes<HistoricoVisualizacao>, InferCreationAttributes<HistoricoVisualizacao>> {
  declare id: CreationOptional<bigint>
  declare usuarioId: bigint
  declare empresaId: bigint
  declare materialId: bigint
  declare versao: number
  declare visualizadoEm: CreationOptional<Date>
}

HistoricoVisualizacao.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'usuario_id' },
  empresaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'empresa_id' },
  materialId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'material_id' },
  versao: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  visualizadoEm: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'visualizado_em' },
}, {
  sequelize,
  tableName: 'historico_visualizacao',
  timestamps: false,
  indexes: [{ name: 'idx_historico_usuario_empresa', fields: ['usuario_id', 'empresa_id', 'visualizado_em'] }],
})
