import { GoogleGenAI } from '@google/genai'

const MAX_TRANSCRIPT_LENGTH = 100_000
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

  let response
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `
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
      `,
      config: {
        responseMimeType: 'application/json',
      },
    })
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : ''
    throw new Error(`Erro ao consultar o Gemini${detail}`)
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
