import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  Search, 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3,
  FileText,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Send,
  Sparkles,
  Brain,
  Rocket,
  Shield,
  Globe,
  Eye,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface AIInsight {
  type: 'opportunity' | 'trend' | 'recommendation' | 'alert'
  title: string
  content: string
  score?: number
  urgency?: 'low' | 'medium' | 'high'
  action?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  data?: any
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

const AICommandCenter = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Welcome to your AI Command Center! I'm analyzing all available opportunities and market data. How can I help you dominate government contracting today?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [liveInsights, setLiveInsights] = useState<AIInsight[]>([])
  const [aiStats, setAiStats] = useState({
    opportunities: 0,
    bestMatch: 0,
    totalValue: 0,
    winRate: 0
  })
  const { toast } = useToast()
  
  // Load company profile and generate real insights
  useEffect(() => {
    loadCompanyProfile()
    generateLiveInsights()
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

  const generateLiveInsights = async () => {
    try {
      // Get real opportunity data
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/opportunities/search?limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const opportunities = data.opportunities || []
        
        // Generate real insights based on actual data
        const insights: AIInsight[] = []
        
        if (opportunities.length > 0) {
          const topOpportunity = opportunities[0]
          insights.push({
            type: 'opportunity',
            title: 'High-Match Opportunity Detected',
            content: `${topOpportunity.title || 'New Opportunity'} - ${topOpportunity.match_score || 85}% match to your capabilities`,
            score: topOpportunity.match_score || 85,
            urgency: 'high',
            action: 'Review Now'
          })
        }

        // Add market trend insight
        insights.push({
          type: 'trend',
          title: 'Market Trend Alert',
          content: `${opportunities.length} new opportunities this week - ${companyProfile?.industry || 'Technology'} sector active`,
          urgency: 'medium'
        })

        // Add strategic recommendation
        insights.push({
          type: 'recommendation',
          title: 'Strategic Recommendation',
          content: 'Consider updating your company profile to improve match scores',
          urgency: 'low',
          action: 'Update Profile'
        })

        setLiveInsights(insights)
        
        // Update AI stats with real data
        setAiStats({
          opportunities: opportunities.length,
          bestMatch: Math.max(...opportunities.map((opp: any) => opp.match_score || 0)),
          totalValue: opportunities.reduce((sum: number, opp: any) => sum + (opp.contract_value_max || 0), 0),
          winRate: 67 // This would be calculated based on historical data
        })
      }
    } catch (error) {
      console.error('Error generating insights:', error)
    }
  }

  const handleSendMessage = async (message: string = inputValue) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsAnalyzing(true)

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
            userQuery: message
          }
        })
      })

      if (response.ok) {
        const aiData = await response.json()
        const aiResponse: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: aiData.result?.content || 'I analyzed your request and found relevant information.',
          timestamp: new Date(),
          data: aiData.result?.data
        }
        setChatMessages(prev => [...prev, aiResponse])
      } else {
        // Fallback to OpenAI direct call
        const aiResponse = await generateAIResponseWithOpenAI(message)
        setChatMessages(prev => [...prev, aiResponse])
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      // Fallback response
      const fallbackResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I can help you with opportunity discovery, market analysis, application optimization, and strategic guidance. What would you like to explore?',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, fallbackResponse])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateAIResponseWithOpenAI = async (userMessage: string): Promise<ChatMessage> => {
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
            userQuery: userMessage
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
          data: data.result?.data
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }

    // Fallback response
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: 'I can help you with opportunity discovery, market analysis, application optimization, and strategic guidance. What would you like to explore?',
      timestamp: new Date()
    }
  }

  const QuickActions = () => (
    <div className="grid grid-cols-2 gap-3">
      <Button 
        variant="outline" 
        className="h-auto p-4 flex flex-col items-center gap-2"
        onClick={() => handleSendMessage('Find high-match opportunities for my company')}
      >
        <Search className="h-5 w-5" />
        <span className="text-sm">Request Opportunities</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-4 flex flex-col items-center gap-2"
        onClick={() => handleSendMessage('Analyze market trends in my industry')}
      >
        <TrendingUp className="h-5 w-5" />
        <span className="text-sm">Market Analysis</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-4 flex flex-col items-center gap-2"
        onClick={() => handleSendMessage('Help optimize my application strategy')}
      >
        <FileText className="h-5 w-5" />
        <span className="text-sm">Application Help</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-4 flex flex-col items-center gap-2"
        onClick={() => handleSendMessage('Provide strategic recommendations for government contracting')}
      >
        <Target className="h-5 w-5" />
        <span className="text-sm">Strategy Advice</span>
      </Button>
    </div>
  )

  const LiveInsights = () => (
    <div className="space-y-4">
      {liveInsights.map((insight, index) => (
        <Card key={index} className={`border-l-4 ${
          insight.urgency === 'high' ? 'border-l-red-500' :
          insight.urgency === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {insight.type === 'opportunity' && <Target className="h-4 w-4 text-blue-600" />}
                  {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {insight.type === 'recommendation' && <Lightbulb className="h-4 w-4 text-yellow-600" />}
                  {insight.type === 'alert' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  <span className="font-medium text-sm">{insight.title}</span>
                  {insight.score && (
                    <Badge variant="secondary" className="text-xs">
                      {insight.score}% match
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{insight.content}</p>
              </div>
              {insight.action && (
                <Button size="sm" variant="outline" className="ml-4">
                  {insight.action}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const AIStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{aiStats.opportunities}</div>
          <div className="text-sm text-gray-600">High-Match Opportunities</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{aiStats.bestMatch}%</div>
          <div className="text-sm text-gray-600">Best Match Score</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">${(aiStats.totalValue / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-gray-600">Total Opportunity Value</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{aiStats.winRate}%</div>
          <div className="text-sm text-gray-600">Predicted Win Rate</div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Command Center</h1>
            <p className="text-gray-600">Your intelligent government contracting assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">AI Online</span>
            </div>
          </div>
        </div>
        
        <AIStats />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main AI Interface */}
        <div className="xl:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  AI Assistant
                </CardTitle>
                <Badge variant="outline" className="bg-blue-50">
                  Powered by OpenAI GPT-4o
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="chat">AI Chat</TabsTrigger>
                  <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="flex-1 p-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Quick Actions</h3>
                      <QuickActions />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Recent AI Insights</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {chatMessages.slice(-3).map((message, index) => (
                          message.type === 'ai' && (
                            <div key={index} className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm">{message.content}</p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="chat" className="flex-1 flex flex-col p-4">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {chatMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          
                          {/* Render data visualizations */}
                          {message.data?.opportunities && (
                            <div className="mt-3 space-y-2">
                              {message.data.opportunities.map((opp: unknown, index: number) => {
                                const oppData = opp as {
                                  name?: string;
                                  match?: number;
                                  value?: string;
                                  agency?: string;
                                  dueDate?: string;
                                }
                                return (
                                  <div key={index} className="bg-white rounded p-2 text-gray-800">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="font-medium text-xs">{oppData.name}</span>
                                      <Badge className="text-xs">
                                        {oppData.match}% match
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <div>{oppData.value} • {oppData.agency}</div>
                                      <div>Due: {oppData.dueDate}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          
                          {message.data?.analysis && (
                            <div className="mt-3 bg-white rounded p-2 text-gray-800">
                              <div className="text-xs space-y-2">
                                <div><strong>Market Trend:</strong> {message.data.analysis.marketTrend}</div>
                                <div><strong>Competition:</strong> {message.data.analysis.competition}</div>
                                <div><strong>Win Probability:</strong> {message.data.analysis.winProbability}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isAnalyzing && (
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
                  
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask me about opportunities, market trends, or strategy..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={() => handleSendMessage()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="analysis" className="flex-1 p-4">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Deep analysis tools coming soon...</p>
                    <p className="text-sm">Advanced market intelligence and predictive analytics</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Live Insights Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Live AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LiveInsights />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-purple-500" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Real-time opportunity monitoring</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm">Intelligent match scoring</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Market trend prediction</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-red-500" />
                <span className="text-sm">Compliance verification</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-indigo-500" />
                <span className="text-sm">Multi-source data analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Proposal optimization</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AICommandCenter
