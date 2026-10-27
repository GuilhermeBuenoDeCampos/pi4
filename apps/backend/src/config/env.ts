export const env = {
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: process.env.JWT_SECRET ?? 'infinity-code-dev-secret-change-me',
  accessTokenExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  refreshTokenExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  passwordTokenExpiresMinutes: Number(process.env.PASSWORD_TOKEN_EXPIRES_MINUTES ?? 60),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM ?? 'Infinity Code <nao-responda@infinitycode.com>',
  },
}
