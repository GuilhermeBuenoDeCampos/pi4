import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../config/env.js'

type MailInput = {
  to: string
  subject: string
  html: string
}

let transporter: Transporter | null = null

function getTransporter() {
  if (!env.mail.host) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
    })
  }
  return transporter
}

export async function sendMail({ to, subject, html }: MailInput) {
  const client = getTransporter()
  if (!client) {
    console.log(`[mail:dev] Para: ${to} | Assunto: ${subject}\n${html}`)
    return
  }
  await client.sendMail({ from: env.mail.from, to, subject, html })
}

export function inviteEmailHtml(nome: string, empresa: string, link: string) {
  return `<p>Olá, ${nome}!</p>
<p>Você foi convidado para acessar a plataforma da empresa <strong>${empresa}</strong>.</p>
<p>Para definir sua senha, clique no link abaixo:</p>
<p><a href="${link}">Definir minha senha</a></p>
<p>Se o link não funcionar, copie e cole no navegador:<br />${link}</p>`
}

export function resetEmailHtml(nome: string, link: string) {
  return `<p>Olá, ${nome}!</p>
<p>Recebemos uma solicitação para redefinir sua senha na Infinity Code.</p>
<p>Clique no link abaixo para criar uma nova senha:</p>
<p><a href="${link}">Redefinir senha</a></p>
<p>Se não foi você, ignore este e-mail.</p>`
}
