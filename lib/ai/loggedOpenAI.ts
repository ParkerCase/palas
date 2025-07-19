import OpenAI from 'openai'
import { logger, logOpenAIUsage } from '@/lib/utils/logger'

// Token cost estimates (approximate)
const TOKEN_COSTS = {
  'gpt-4o': { input: 0.000005, output: 0.000015 },
  'gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
  'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
  'gpt-3.5-turbo': { input: 0.0000005, output: 0.0000015 }
}

export class LoggedOpenAIService {
  private openai: OpenAI
  private component: string

  constructor(apiKey: string, component: string = 'OpenAIService') {
    this.openai = new OpenAI({ apiKey })
    this.component = component
  }

  // Calculate cost based on tokens and model
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS]
    if (!costs) {
      // Default to gpt-4o costs if model not found
      return inputTokens * 0.000005 + outputTokens * 0.000015
    }
    return inputTokens * costs.input + outputTokens * costs.output
  }

  // Check if response appears to be mock data
  private isMockResponse(content: string): boolean {
    if (!content) return false

    const mockPatterns = [
      'mock',
      'test',
      'sample',
      'example',
      'dummy',
      'fake',
      'placeholder',
      'this is a test',
      'sample response',
      'mock data',
      'test data'
    ]

    const contentLower = content.toLowerCase()
    return mockPatterns.some(pattern => contentLower.includes(pattern))
  }

  // Log OpenAI usage
  private logUsage(
    action: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const cost = this.calculateCost(model, inputTokens, outputTokens)
    const totalTokens = inputTokens + outputTokens

    logOpenAIUsage(
      this.component,
      action,
      model,
      totalTokens,
      cost,
      success,
      {
        ...metadata,
        inputTokens,
        outputTokens,
        totalTokens
      }
    )

    // If this appears to be a mock response, log a warning
    if (metadata?.responseContent && this.isMockResponse(metadata.responseContent)) {
      logger.mockData(
        this.component,
        action,
        'OpenAI Response',
        'Detected potential mock response from OpenAI API',
        {
          model,
          responsePreview: metadata.responseContent.substring(0, 200),
          totalTokens,
          cost
        }
      )
    }
  }

  // Create chat completion with logging
  async createChatCompletion(
    action: string,
    model: string,
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    options?: Partial<Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, 'model' | 'messages'>>
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const startTime = Date.now()
    
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        ...(options || {})
      })

      const responseTime = Date.now() - startTime
      const choice = response.choices[0]
      const content = choice?.message?.content || ''
      const inputTokens = response.usage?.prompt_tokens || 0
      const outputTokens = response.usage?.completion_tokens || 0

      // Log successful usage
      this.logUsage(
        action,
        model,
        inputTokens,
        outputTokens,
        true,
        {
          responseContent: content,
          responseTime,
          finishReason: choice?.finish_reason,
          messageCount: messages.length
        }
      )

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Log failed usage
      this.logUsage(
        action,
        model,
        0,
        0,
        false,
        {
          responseTime,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          messageCount: messages.length
        }
      )

      throw error
    }
  }

  // Create completion with logging (legacy API)
  async createCompletion(
    action: string,
    model: string,
    prompt: string,
    options?: OpenAI.Completions.CompletionCreateParamsNonStreaming
  ): Promise<OpenAI.Completions.Completion> {
    const startTime = Date.now()
    
    try {
      const response = await this.openai.completions.create({
        model,
        prompt,
        ...options
      })

      const responseTime = Date.now() - startTime
      const content = response.choices[0]?.text || ''
      const inputTokens = response.usage?.prompt_tokens || 0
      const outputTokens = response.usage?.completion_tokens || 0

      // Log successful usage
      this.logUsage(
        action,
        model,
        inputTokens,
        outputTokens,
        true,
        {
          responseContent: content,
          responseTime,
          finishReason: response.choices[0]?.finish_reason,
          promptLength: prompt.length
        }
      )

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Log failed usage
      this.logUsage(
        action,
        model,
        0,
        0,
        false,
        {
          responseTime,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          promptLength: prompt.length
        }
      )

      throw error
    }
  }

  // Embeddings with logging
  async createEmbedding(
    action: string,
    model: string,
    input: string | string[],
    options?: OpenAI.Embeddings.EmbeddingCreateParams
  ): Promise<OpenAI.Embeddings.CreateEmbeddingResponse> {
    const startTime = Date.now()
    
    try {
      const response = await this.openai.embeddings.create({
        model,
        input,
        ...options
      })

      const responseTime = Date.now() - startTime
      const inputTokens = response.usage?.prompt_tokens || 0

      // Log successful usage
      this.logUsage(
        action,
        model,
        inputTokens,
        0, // Embeddings don't have output tokens
        true,
        {
          responseTime,
          embeddingCount: response.data.length,
          inputType: Array.isArray(input) ? 'array' : 'string',
          inputLength: Array.isArray(input) ? input.length : input.length
        }
      )

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Log failed usage
      this.logUsage(
        action,
        model,
        0,
        0,
        false,
        {
          responseTime,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          inputType: Array.isArray(input) ? 'array' : 'string',
          inputLength: Array.isArray(input) ? input.length : input.length
        }
      )

      throw error
    }
  }

  // Get the underlying OpenAI client
  getClient(): OpenAI {
    return this.openai
  }
}

// Factory function to create logged OpenAI service
export function createLoggedOpenAIService(
  apiKey: string,
  component: string = 'OpenAIService'
): LoggedOpenAIService {
  return new LoggedOpenAIService(apiKey, component)
}

// Export a default logged OpenAI service instance
export const loggedOpenAI = createLoggedOpenAIService(
  process.env.OPENAI_API_KEY!,
  'DefaultOpenAIService'
) 