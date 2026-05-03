const KIMI_BASE_URL = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.ai/v1'
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2.5'

export interface KimiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface KimiTextCompletionOptions {
  apiKey: string
  messages: KimiChatMessage[]
  temperature: number
  maxTokens: number
  timeoutMs: number
}

export async function requestKimiTextCompletion(options: KimiTextCompletionOptions) {
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs)

    try {
      const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
          model: KIMI_MODEL,
          messages: options.messages,
          temperature: KIMI_MODEL === 'kimi-k2.5' ? 1 : options.temperature,
          max_tokens: options.maxTokens,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await response.text()
        const retryable = response.status === 429 || response.status >= 500
        if (retryable && attempt < maxAttempts) {
          await sleepFor(500 * attempt)
          continue
        }
        throw new Error(`Kimi API error: ${response.status} - ${body}`)
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string
          }
        }>
      }

      const content = data.choices?.[0]?.message?.content?.trim()
      if (!content) {
        throw new Error('No content from Kimi AI')
      }

      return content
    } catch (error) {
      clearTimeout(timeoutId)

      const isAbortError = error instanceof Error && error.name === 'AbortError'
      const isRetryable = isAbortError || (error instanceof Error && /fetch failed|ECONNRESET|ETIMEDOUT/i.test(error.message))

      if (isRetryable && attempt < maxAttempts) {
        await sleepFor(500 * attempt)
        continue
      }

      throw error
    }
  }

  throw new Error('Kimi API request failed after retries')
}

function sleepFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
