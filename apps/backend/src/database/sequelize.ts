import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize(
  process.env.DB_NAME ?? 'onboarding_corporativo',
  process.env.DB_USER ?? 'root',
  process.env.DB_PASSWORD ?? '',
  {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      timestamps: false,
      freezeTableName: true,
    },
  },
)
