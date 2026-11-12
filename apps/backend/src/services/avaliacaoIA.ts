import { GoogleGenAI } from '@google/genai'

const MAX_TRANSCRIPT_LENGTH = 100_000
const MAX_GEMINI_ATTEMPTS = 2
const geminiModels = [
  process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
  process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-2.5-flash',
]
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

type Evaluation = {
  pontuacao: number
  resumo: string
  etapas: { etapa: string; status: string; justificativa: string }[]
  pontos_melhoria: string[]
  feedback: string
}

export type PopDraft = {
  titulo: string
  codigo: string
  categoria: string
  descricao: string
  procedimento: string
}

function isTemporaryGeminiError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  const candidate = error as { status?: unknown; message?: unknown }
  return candidate.status === 503
    || (typeof candidate.message === 'string'
      && (candidate.message.includes('"code":503') || candidate.message.includes('"status":"UNAVAILABLE"')))
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function avaliarConhecimento(
  transcricaoAula: string,
  transcricaoColaborador: string,
): Promise<Evaluation> {
  if (typeof transcricaoAula !== 'string' || !transcricaoAula.trim()) {
    throw new Error('A transcrição da aula é obrigatória.')
  }
  if (typeof transcricaoColaborador !== 'string' || !transcricaoColaborador.trim()) {
    throw new Error('A transcrição do colaborador é obrigatória.')
  }
  if (transcricaoAula.length > MAX_TRANSCRIPT_LENGTH || transcricaoColaborador.length > MAX_TRANSCRIPT_LENGTH) {
    throw new Error('As transcrições excedem o limite permitido.')
  }

  const contents = `
        Você é um avaliador de treinamentos corporativos.

        Compare as duas transcrições.

        Identifique:
        - Etapas compreendidas.
        - Etapas parcialmente compreendidas.
        - Etapas não mencionadas.
        - Informações incorretas.
        - Pontos que precisam ser reforçados.

        Reconheça sinônimos e equivalências de significado.
        Não exija palavras idênticas.
        Não invente informações.

        AULA:
        ${transcricaoAula}

        RESPOSTA DO COLABORADOR:
        ${transcricaoColaborador}

        Retorne um JSON contendo:
        pontuacao, resumo, etapas,
        pontos_melhoria e feedback.

        A pontuacao deve ser um número de 0 a 100.
        Cada item de etapas deve conter etapa, status e justificativa.
        status deve ser um destes valores:
        compreendido, parcial, nao_mencionado ou incorreto.
      `
  let response
  let lastTemporaryError: unknown

  for (const model of geminiModels) {
    const request = {
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    }

    for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt += 1) {
      try {
        response = await ai.models.generateContent(request)
        break
      } catch (error) {
        if (!isTemporaryGeminiError(error)) {
          throw new Error(`Erro ao consultar o Gemini (${model}): ${getErrorMessage(error)}`)
        }
        lastTemporaryError = error
        if (attempt < MAX_GEMINI_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 1_500 * attempt))
        }
      }
    }

    if (response) break
  }

  if (!response) {
    const detail = lastTemporaryError ? `: ${getErrorMessage(lastTemporaryError)}` : ''
    throw new Error(`Os modelos do Gemini estão temporariamente indisponíveis. Tente novamente em alguns instantes${detail}`)
  }

  const content = response.text
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('O Gemini não retornou uma avaliação.')
  }

  let result: Evaluation
  try {
    result = JSON.parse(content) as Evaluation
  } catch {
    throw new Error('O Gemini retornou uma avaliação em formato inválido.')
  }

  if (typeof result.pontuacao !== 'number' || result.pontuacao < 0 || result.pontuacao > 100) {
    throw new Error('O Gemini retornou uma pontuação inválida.')
  }
  if (!result.resumo || !Array.isArray(result.etapas) || !Array.isArray(result.pontos_melhoria) || !result.feedback) {
    throw new Error('O Gemini retornou uma avaliação incompleta.')
  }
  return result
}

export async function gerarPop(transcricao: string): Promise<PopDraft> {
  if (typeof transcricao !== 'string' || !transcricao.trim()) {
    throw new Error('A transcrição para criar o POP é obrigatória.')
  }
  if (transcricao.length > MAX_TRANSCRIPT_LENGTH) {
    throw new Error('A transcrição excede o limite permitido.')
  }

  const contents = `
    Você é um especialista em documentação de procedimentos operacionais padrão (POP).
    Transforme a transcrição abaixo em um POP claro, objetivo e seguro.
    Não invente informações que não estejam na transcrição. Quando um dado não estiver disponível,
    use um valor genérico seguro no título, código ou categoria.
    Organize o procedimento em etapas numeradas, mantendo alertas e critérios de segurança.
    Retorne somente JSON válido com:
    titulo, codigo, categoria, descricao e procedimento.
    titulo deve ter no máximo 200 caracteres; codigo no máximo 60; categoria no máximo 100;
    descricao deve ser um resumo curto; procedimento deve conter as etapas completas.

    TRANSCRIÇÃO:
    ${transcricao}
  `

  let response
  let lastTemporaryError: unknown
  for (const model of geminiModels) {
    for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt += 1) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: { responseMimeType: 'application/json' },
        })
        break
      } catch (error) {
        if (!isTemporaryGeminiError(error)) {
          throw new Error(`Erro ao consultar o Gemini (${model}): ${getErrorMessage(error)}`)
        }
        lastTemporaryError = error
        if (attempt < MAX_GEMINI_ATTEMPTS) await new Promise(resolve => setTimeout(resolve, 1_500 * attempt))
      }
    }
    if (response) break
  }

  if (!response) {
    const detail = lastTemporaryError ? `: ${getErrorMessage(lastTemporaryError)}` : ''
    throw new Error(`Os modelos do Gemini estão temporariamente indisponíveis. Tente novamente em alguns instantes${detail}`)
  }
  const content = response.text
  if (typeof content !== 'string' || !content.trim()) throw new Error('O Gemini não retornou um POP.')

  let draft: Partial<PopDraft>
  try {
    draft = JSON.parse(content) as Partial<PopDraft>
  } catch {
    throw new Error('O Gemini retornou o POP em formato inválido.')
  }
  const fields = ['titulo', 'codigo', 'categoria', 'descricao', 'procedimento'] as const
  if (fields.some(field => typeof draft[field] !== 'string' || !draft[field]?.trim())) {
    throw new Error('O Gemini retornou um POP incompleto.')
  }
  return {
    titulo: draft.titulo!.trim().slice(0, 200),
    codigo: draft.codigo!.trim().slice(0, 60),
    categoria: draft.categoria!.trim().slice(0, 100),
    descricao: draft.descricao!.trim(),
    procedimento: draft.procedimento!.trim(),
  }
}
