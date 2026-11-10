
const MAX_TRANSCRIPT_LENGTH = 100_000
const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434/api/chat'
const ollamaModel = process.env.OLLAMA_MODEL ?? 'llama3.1:8b'

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
  const response = await fetch(ollamaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      stream: false,
      format: 'json',
      messages: [
        {
          role: 'system',
          content: `
            Você é um avaliador de treinamentos.

            Compare as duas transcrições.
            Avalie o conhecimento demonstrado.
            Identifique acertos, omissões e erros.
            Reconheça sinônimos e explicações equivalentes.
            Não exija palavras idênticas.
            Não invente informações que não estejam nas transcrições.
            Retorne somente JSON válido, sem markdown, com:
            pontuacao (número de 0 a 100), resumo (string), etapas (array),
            pontos_melhoria (array de strings) e feedback (string).

            Cada item de etapas deve conter etapa, status e justificativa.
            status deve ser um destes valores:
            compreendido, parcial, nao_mencionado ou incorreto.
          `,
        },
        {
          role: 'user',
          content: `
      TRANSCRIÇÃO DA AULA:

      ${transcricaoAula}

      TRANSCRIÇÃO DO COLABORADOR:

      ${transcricaoColaborador}

      Compare os dois conteúdos e avalie
      o conhecimento demonstrado.
          `,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    let detail = ''
    try {
      const parsed = JSON.parse(errorBody) as { error?: unknown }
      if (typeof parsed.error === 'string') detail = `: ${parsed.error}`
    } catch {
      if (errorBody.trim()) detail = `: ${errorBody.trim()}`
    }
    if (response.status === 404) {
      throw new Error(`Modelo do Ollama não encontrado (${ollamaModel}). Execute "ollama pull ${ollamaModel}" e tente novamente${detail}.`)
    }
    throw new Error(`Erro ao consultar o Ollama (${response.status})${detail}.`)
  }

  const data = await response.json() as { message?: { content?: unknown } }
  const content = data.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('O Ollama não retornou uma avaliação.')
  }

  let result: Evaluation
  try {
    result = JSON.parse(content) as Evaluation
  } catch {
    throw new Error('O Ollama retornou uma avaliação em formato inválido.')
  }

  if (typeof result.pontuacao !== 'number' || result.pontuacao < 0 || result.pontuacao > 100) {
    throw new Error('O Ollama retornou uma pontuação inválida.')
  }
  if (!result.resumo || !Array.isArray(result.etapas) || !Array.isArray(result.pontos_melhoria) || !result.feedback) {
    throw new Error('O Ollama retornou uma avaliação incompleta.')
  }
  return result
}