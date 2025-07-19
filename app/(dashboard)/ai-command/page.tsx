'use client'

import { useAuth } from '../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, Send, Loader2, AlertTriangle, Lightbulb, 
  TrendingUp, FileText, Search, Zap
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  action?: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  action: string
  icon: React.ReactNode
  prompt: string
}

export default function AICommandPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const quickActions: QuickAction[] = [
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      description: 'Analyze market trends and opportunities',
      action: 'market_intelligence',
      icon: <TrendingUp className="h-5 w-5" />,
      prompt: 'Provide a comprehensive market analysis for government contracting opportunities in my industry, including current trends, key agencies to target, and strategic recommendations.'
    },
    {
      id: 'opportunity-analysis',
      title: 'Opportunity Analysis',
      description: 'Analyze specific opportunities for fit',
      action: 'analyze_opportunity',
      icon: <Search className="h-5 w-5" />,
      prompt: 'Help me analyze government contracting opportunities. What should I look for in terms of fit with my company profile, competition level, and win probability?'
    },
    {
      id: 'proposal-help',
      title: 'Proposal Strategy',
      description: 'Get help with proposal writing',
      action: 'proposal_help',
      icon: <FileText className="h-5 w-5" />,
      prompt: 'I need help with writing a winning government proposal. Provide guidance on structure, key evaluation criteria, and best practices for success.'
    },
    {
      id: 'competitive-intelligence',
      title: 'Competitive Intelligence',
      description: 'Understand your competition',
      action: 'market_intelligence',
      icon: <Lightbulb className="h-5 w-5" />,
      prompt: 'Analyze the competitive landscape for government contracting in my sector. Who are the key players, what are their strengths, and how can I differentiate my company?'
    }
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      // Add welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Welcome to the AI Command Center! I\'m your government contracting AI assistant. I can help you with market analysis, opportunity evaluation, proposal strategy, and competitive intelligence. How can I assist you today?',
          timestamp: new Date()
        }
      ])
    }
  }, [user, loading, router])

  const sendMessage = async (messageContent: string, action?: string) => {
    if (!messageContent.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      action
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          action: action || 'general',
          context: messages.slice(-5) // Send last 5 messages for context
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        action: data.action
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      setError(error.message)
      console.error('AI chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const handleQuickAction = (quickAction: QuickAction) => {
    sendMessage(quickAction.prompt, quickAction.action)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">AI Command Center</h1>
              <Badge className="bg-purple-100 text-purple-800">
                <Bot className="h-3 w-3 mr-1" />
                OpenAI Powered
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => router.push('/opportunities')}>
                Opportunities
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Card 
                key={action.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleQuickAction(action)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI Assistant</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3xl p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-75 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                      {message.action && (
                        <Badge variant="secondary" className="ml-2">
                          {message.action}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Error: {error}</span>
                </div>
              </div>
            )}

            {/* Input form */}
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about government contracting..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !inputMessage.trim()}
                className="flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Tips */}
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Pro Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Ask about specific agencies or contract types</li>
                <li>Request market analysis for your industry</li>
                <li>Get help with proposal strategy and writing</li>
                <li>Analyze opportunities for fit and win probability</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}