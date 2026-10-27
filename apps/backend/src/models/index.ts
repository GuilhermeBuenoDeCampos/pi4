import { Atribuicao } from './Atribuicao.js'
import { Cargo } from './Cargo.js'
import { Empresa } from './Empresa.js'
import { EmpresaUsuario } from './EmpresaUsuario.js'
import { FichaTecnica } from './FichaTecnica.js'
import { Material } from './Material.js'
import { Pop } from './Pop.js'
import { Progresso } from './Progresso.js'
import { Trilha } from './Trilha.js'
import { TrilhaMaterial } from './TrilhaMaterial.js'
import { TokenSenha } from './TokenSenha.js'
import { Usuario } from './Usuario.js'
import { Video } from './Video.js'

Empresa.hasMany(Cargo, { foreignKey: 'empresaId', as: 'cargos' })
Cargo.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' })
Empresa.hasMany(EmpresaUsuario, { foreignKey: 'empresaId', as: 'vinculos' })
EmpresaUsuario.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' })
EmpresaUsuario.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' })
EmpresaUsuario.belongsTo(Cargo, { foreignKey: 'cargoId', as: 'cargo' })
Empresa.hasMany(Trilha, { foreignKey: 'empresaId', as: 'trilhas' })
Trilha.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' })
Empresa.hasMany(Material, { foreignKey: 'empresaId', as: 'materiais' })
Material.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' })
Material.hasOne(Video, { foreignKey: 'materialId', as: 'video', onDelete: 'CASCADE' })
Video.belongsTo(Material, { foreignKey: 'materialId', as: 'material' })
Material.hasOne(Pop, { foreignKey: 'materialId', as: 'pop', onDelete: 'CASCADE' })
Pop.belongsTo(Material, { foreignKey: 'materialId', as: 'material' })
Material.hasOne(FichaTecnica, { foreignKey: 'materialId', as: 'fichaTecnica', onDelete: 'CASCADE' })
FichaTecnica.belongsTo(Material, { foreignKey: 'materialId', as: 'material' })
Trilha.belongsToMany(Material, { through: TrilhaMaterial, foreignKey: 'trilhaId', otherKey: 'materialId', as: 'materiais' })
Material.belongsToMany(Trilha, { through: TrilhaMaterial, foreignKey: 'materialId', otherKey: 'trilhaId', as: 'trilhas' })
TrilhaMaterial.belongsTo(Trilha, { foreignKey: 'trilhaId', as: 'trilha' })
TrilhaMaterial.belongsTo(Material, { foreignKey: 'materialId', as: 'material' })
EmpresaUsuario.hasMany(Atribuicao, { foreignKey: 'empresaUsuarioId', as: 'atribuicoes' })
Atribuicao.belongsTo(EmpresaUsuario, { foreignKey: 'empresaUsuarioId', as: 'vinculo' })
Atribuicao.belongsTo(Trilha, { foreignKey: 'trilhaId', as: 'trilha' })
Atribuicao.belongsTo(Usuario, { foreignKey: 'atribuidoPor', as: 'atribuidor' })
Atribuicao.hasMany(Progresso, { foreignKey: 'atribuicaoId', as: 'progressos' })
Progresso.belongsTo(Atribuicao, { foreignKey: 'atribuicaoId', as: 'atribuicao' })
Progresso.belongsTo(TrilhaMaterial, { foreignKey: 'trilhaMaterialId', as: 'item' })
Usuario.hasMany(TokenSenha, { foreignKey: 'usuarioId', as: 'tokensSenha' })
TokenSenha.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' })

export {
  Atribuicao, Cargo, Empresa, EmpresaUsuario, FichaTecnica, Material,
  Pop, Progresso, TokenSenha, Trilha, TrilhaMaterial, Usuario, Video,
}
