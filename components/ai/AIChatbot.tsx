'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Search, 
  TrendingUp, 
  Target, 
  Zap, 
  MessageSquare,
  Send,
  X,
  Sparkles,
  Brain
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  data?: any
  suggestions?: string[]
}

interface CompanyProfile {
  id: string
  name: string
  industry: string
  naics_codes: string[]
  capabilities: string[]
  certifications: string[]
  target_jurisdictions: string[]
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m your AI contracting assistant. I can help you discover opportunities, analyze matches, and optimize your applications. What would you like to explore?',
      timestamp: new Date(),
      suggestions: [
        'Find matching opportunities',
        'Analyze my company fit',
        'Predict upcoming contracts',
        'Review spending trends'
      ]
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadCompanyProfile()
  }, [])

  const loadCompanyProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase.auth.getUser()
      if (!profile.user) return

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.user.id)
        .single()

      if (company) {
        setCompanyProfile(company)
      }
    } catch (error) {
      console.error('Error loading company profile:', error)
    }
  }

  const handleSend = async (message: string = inputValue) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Call real AI API
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message,
          context: {
            companyProfile,
            userQuery: message,
            chatHistory: messages.slice(-5) // Send last 5 messages for context
          }
        })
      })

      if (response.ok) {
        const aiData = await response.json()
        const aiResponse: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: aiData.result?.content || 'I analyzed your request and found relevant information.',
          timestamp: new Date(),
          data: aiData.result?.data,
          suggestions: generateSuggestions(message)
        }
        setMessages(prev => [...prev, aiResponse])
      } else {
        // Fallback to OpenAI direct call
        const aiResponse = await generateAIResponseWithOpenAI(message)
        setMessages(prev => [...prev, aiResponse])
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      // Fallback response
      const fallbackResponse: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I can help you with opportunity discovery, match analysis, spending trends, and application optimization. What specific area interests you most?',
        timestamp: new Date(),
        suggestions: [
          'Show me high-match opportunities',
          'Predict upcoming contracts',
          'Analyze my win probability',
          'Review sector spending trends'
        ]
      }
      setMessages(prev => [...prev, fallbackResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponseWithOpenAI = async (userMessage: string): Promise<Message> => {
    try {
      const response = await fetch('/api/test/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          context: {
            companyProfile,
            userQuery: userMessage,
            chatHistory: messages.slice(-5)
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        return {
          id: Date.now().toString(),
          type: 'ai',
          content: data.result?.content || 'I analyzed your request and found relevant information.',
          timestamp: new Date(),
          data: data.result?.data,
          suggestions: generateSuggestions(userMessage)
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }

    // Fallback response
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: 'I can help you with opportunity discovery, match analysis, spending trends, and application optimization. What specific area interests you most?',
      timestamp: new Date(),
      suggestions: [
        'Show me high-match opportunities',
        'Predict upcoming contracts',
        'Analyze my win probability',
        'Review sector spending trends'
      ]
    }
  }

  const generateSuggestions = (userMessage: string): string[] => {
    const message = userMessage.toLowerCase()
    
    if (message.includes('opportunity') || message.includes('find') || message.includes('match')) {
      return ['Analyze opportunity details', 'Set alerts for similar contracts', 'View competitive landscape']
    } else if (message.includes('predict') || message.includes('upcoming') || message.includes('forecast')) {
      return ['Set prediction alerts', 'Analyze budget trends', 'Review competitive positioning']
    } else if (message.includes('analyze') || message.includes('company') || message.includes('fit')) {
      return ['Get certification guidance', 'Find potential partners', 'View improvement plan']
    } else if (message.includes('trend') || message.includes('spending') || message.includes('market')) {
      return ['View detailed spending report', 'Set trend alerts', 'Analyze by agency']
    } else {
      return [
        'Show me high-match opportunities',
        'Predict upcoming contracts',
        'Analyze my win probability',
        'Review sector spending trends'
      ]
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion)
  }

  const formatCurrency = (amount: string) => {
    return amount.replace(/\$/, '$')
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-blue-600 bg-blue-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
      >
        <Bot className="h-6 w-6" />
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-50">
          <Card className="w-96 h-[600px] flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Render data-specific content */}
                      {message.data?.opportunities && (
                        <div className="mt-3 space-y-2">
                          {message.data.opportunities.map((opp: unknown, index: number) => {
                            const oppData = opp as {
                              name?: string;
                              match?: number;
                              value?: string;
                              dueDate?: string;
                            }
                            return (
                              <div key={index} className="bg-white rounded p-2 text-gray-800">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-xs">{oppData.name}</span>
                                  <Badge className={`text-xs ${getScoreColor(oppData.match || 0)}`}>
                                    {oppData.match}% match
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>{oppData.value}</span>
                                  <span>Due: {oppData.dueDate}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {message.data?.predictions && (
                        <div className="mt-3 space-y-2">
                          {message.data.predictions.map((pred: unknown, index: number) => {
                            const predData = pred as {
                              category?: string;
                              probability?: number;
                              timeline?: string;
                              value?: string;
                            }
                            return (
                              <div key={index} className="bg-white rounded p-2 text-gray-800">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-xs">{predData.category}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {predData.probability}% likely
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>{predData.timeline}</span>
                                  <span>{predData.value}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {message.data?.analysis && (
                        <div className="mt-3 bg-white rounded p-2 text-gray-800">
                          <div className="text-xs space-y-2">
                            <div><strong>Overall Score:</strong> {message.data.analysis.overallScore}%</div>
                            <div><strong>Strengths:</strong> {message.data.analysis.strengths?.join(', ')}</div>
                            <div><strong>Areas for Improvement:</strong> {message.data.analysis.gaps?.join(', ')}</div>
                          </div>
                        </div>
                      )}

                      {message.data?.trends && (
                        <div className="mt-3 space-y-2">
                          {message.data.trends.map((trend: unknown, index: number) => {
                            const trendData = trend as {
                              metric?: string;
                              change?: string;
                              period?: string;
                              impact?: string;
                            }
                            return (
                              <div key={index} className="bg-white rounded p-2 text-gray-800">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-xs">{trendData.metric}</span>
                                  <Badge className={`text-xs ${getChangeColor(trendData.change || '')}`}>
                                    {trendData.change} {trendData.period}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-600">
                                  Impact: {trendData.impact}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me about opportunities, trends, or strategy..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button onClick={() => handleSend()} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default AIChatbot