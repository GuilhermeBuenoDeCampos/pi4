import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { Cargo, Empresa, EmpresaUsuario, Usuario } from '../models/index.js'
import { sequelize } from './sequelize.js'

async function main() {
  await sequelize.authenticate()

  const senhaHash = await bcrypt.hash('Infinity@123', 10)

  const [infinity] = await Empresa.findOrCreate({
    where: { cnpj: '12345678000190' },
    defaults: {
      razaoSocial: 'Infinity Code Desenvolvimento LTDA',
      nomeFantasia: 'Infinity Code',
      cnpj: '12345678000190',
      ativa: true,
    },
  })

  const [sabor] = await Empresa.findOrCreate({
    where: { cnpj: '98765432000110' },
    defaults: {
      razaoSocial: 'Sabor & Cia Alimentos LTDA',
      nomeFantasia: 'Sabor & Cia',
      cnpj: '98765432000110',
      ativa: true,
    },
  })

  const [admin] = await Usuario.findOrCreate({
    where: { email: 'admin@infinitycode.com' },
    defaults: {
      nome: 'Ana Administradora',
      email: 'admin@infinitycode.com',
      telefone: '(35) 99999-0001',
      senhaHash,
      ativo: true,
    },
  })

  const [colaborador] = await Usuario.findOrCreate({
    where: { email: 'colaborador@infinitycode.com' },
    defaults: {
      nome: 'Carlos Colaborador',
      email: 'colaborador@infinitycode.com',
      telefone: '(35) 99999-0002',
      senhaHash,
      ativo: true,
    },
  })

  const [cargoAdmin] = await Cargo.findOrCreate({
    where: { empresaId: infinity.id, nome: 'Administrador' },
    defaults: { empresaId: infinity.id, nome: 'Administrador', descricao: null },
  })

  await Cargo.findOrCreate({
    where: { empresaId: sabor.id, nome: 'Auxiliar de Cozinha' },
    defaults: { empresaId: sabor.id, nome: 'Auxiliar de Cozinha', descricao: null },
  })

  await EmpresaUsuario.findOrCreate({
    where: { empresaId: infinity.id, usuarioId: admin.id },
    defaults: {
      empresaId: infinity.id,
      usuarioId: admin.id,
      cargoId: cargoAdmin.id,
      papel: 'ADMIN',
      status: 'ATIVO',
      dataEntrada: new Date(),
    },
  })

  await EmpresaUsuario.findOrCreate({
    where: { empresaId: sabor.id, usuarioId: admin.id },
    defaults: {
      empresaId: sabor.id,
      usuarioId: admin.id,
      cargoId: null,
      papel: 'GESTOR',
      status: 'ATIVO',
      dataEntrada: new Date(),
    },
  })

  await EmpresaUsuario.findOrCreate({
    where: { empresaId: infinity.id, usuarioId: colaborador.id },
    defaults: {
      empresaId: infinity.id,
      usuarioId: colaborador.id,
      cargoId: cargoAdmin.id,
      papel: 'COLABORADOR',
      status: 'ATIVO',
      dataEntrada: new Date(),
    },
  })

  console.log('Seed aplicado com sucesso.')
  console.log('Admin (2 empresas): admin@infinitycode.com / Infinity@123')
  console.log('Colaborador (1 empresa): colaborador@infinitycode.com / Infinity@123')

  await sequelize.close()
}

main().catch(error => {
  console.error('Falha ao aplicar o seed:', error)
  process.exitCode = 1
})
