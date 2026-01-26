import { useState, useRef, useEffect } from 'react'
import { Send, X, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import './App.css'

interface Message {
  sender: 'user' | 'ai'
  text: string
}

type AIAgent = 'simple' | 'state' | 'objective' | 'learn'
type Mode = 'prod' | 'test'

interface AIAgentConfig {
  name: string
  endpoint: string
  description: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [username, setUsername] = useState('')
  const [tempUsername, setTempUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>('simple')
  const [showAgentSelector, setShowAgentSelector] = useState(false)
  const [mode, setMode] = useState<Mode>('prod')
  const [showModeSelector, setShowModeSelector] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const getEndpoint = (agent: AIAgent): string => {
    const prefix = mode === 'test' ? '/webhook-test/' : '/webhook/'
    const agentMap = {
      simple: 'chat-simple',
      state: 'chat-state',
      objective: 'chat-objective',
      learn: 'chat-learn'
    }
    return `http://localhost:5678${prefix}${agentMap[agent]}`
  }

  const aiAgents: Record<AIAgent, AIAgentConfig> = {
    simple: {
      name: 'Simples',
      endpoint: getEndpoint('simple'),
      description: 'Assistente básico'
    },
    state: {
      name: 'Baseado em Estados',
      endpoint: getEndpoint('state'),
      description: 'Mantém contexto de estados'
    },
    objective: {
      name: 'Baseado em Objetivos',
      endpoint: getEndpoint('objective'),
      description: 'Focado em alcançar objetivos'
    },
    learn: {
      name: 'Aprendizado',
      endpoint: getEndpoint('learn'),
      description: 'Aprende com interações'
    }
  }

  // Initialize session and check for username on mount
  useEffect(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setSessionId(newSessionId)

    const savedUsername = localStorage.getItem('viajai_username')
    if (savedUsername) {
      setUsername(savedUsername)
      setMessages([{ sender: 'ai', text: `Olá, ${savedUsername}! Sou ViajAI, sua assistente de viagens com capacidades de pesquisar voos, hotéis e pontos turísticos. Como posso ajudá-lo hoje?` }])
    } else {
      setShowAuthPopup(true)
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close agent selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showAgentSelector && !target.closest('.agent-selector-container')) {
        setShowAgentSelector(false)
      }
      if (showModeSelector && !target.closest('.mode-selector-container')) {
        setShowModeSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAgentSelector, showModeSelector])

  const handleSaveUsername = () => {
    const trimmedUsername = tempUsername.trim()

    if (trimmedUsername.length < 3) {
      setUsernameError('O nome deve ter pelo menos 3 caracteres')
      return
    }

    localStorage.setItem('viajai_username', trimmedUsername)
    setUsername(trimmedUsername)
    setShowAuthPopup(false)
    setUsernameError('')
    setMessages([{ sender: 'ai', text: `Olá, ${trimmedUsername}! Sou ViajAI, sua assistente de viagens com capacidades de pesquisar voos, hotéis e pontos turísticos. Como posso ajudá-lo hoje?` }])
  }

  const handleAgentChange = (agent: AIAgent) => {
    setSelectedAgent(agent)
    setShowAgentSelector(false)

    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setSessionId(newSessionId)

    setMessages([{
      sender: 'ai',
      text: `Olá, ${username}! Sou ViajAI, sua assistente de viagens com capacidades de pesquisar voos, hotéis e pontos turísticos. Como posso ajudá-lo hoje?`
    }])
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setShowModeSelector(false)
  }

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setError(null)

    setMessages(prev => [...prev, { sender: 'user', text: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch(getEndpoint(selectedAgent), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          chatInput: userMessage,
          sessionId: sessionId,
          user: username
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.output || data.message || 'Desculpe, não consegui processar sua mensagem.'

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }])
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Verifique se o webhook está ativo.')
      console.error('Error sending message:', err)
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-50"
        style={{ backgroundImage: "url('/images/bg_image.png')" }}
      />

      {/* Chat Container */}
      <div className="relative h-full w-full flex flex-col">
        {/* WhatsApp-style Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-4 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src="/images/viajai_pfp.png"
                  alt="ViajAI Assistant"
                  className="w-full h-full object-cover scale-150 translate-y-2"
                />
              </div>
              <div>
                <h1 className="font-semibold text-lg">ViajAI</h1>
                <div className="flex items-center space-x-1 text-sm">
                  <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></span>
                  <span className="text-purple-100">Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mode Selector Button */}
              <div className="relative mode-selector-container">
                <button
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  <span className={`w-2 h-2 rounded-full ${mode === 'prod' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                  <span className="text-xs font-medium uppercase">{mode}</span>
                </button>

                {showModeSelector && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-purple-500/30 overflow-hidden z-10">
                    <button
                      onClick={() => handleModeChange('prod')}
                      className={`w-full text-left px-4 py-3 hover:bg-purple-500/20 transition-colors border-b border-slate-700/50 ${mode === 'prod' ? 'bg-purple-500/30' : ''}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span className="font-semibold text-white">PROD</span>
                      </div>
                      <div className="text-xs text-purple-200/70 mt-1">Ambiente de produção</div>
                    </button>
                    <button
                      onClick={() => handleModeChange('test')}
                      className={`w-full text-left px-4 py-3 hover:bg-purple-500/20 transition-colors ${mode === 'test' ? 'bg-purple-500/30' : ''}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        <span className="font-semibold text-white">TEST</span>
                      </div>
                      <div className="text-xs text-purple-200/70 mt-1">Ambiente de teste</div>
                    </button>
                  </div>
                )}
              </div>

              {/* Agent Selector Button */}
              <div className="relative agent-selector-container">
                <button
                  onClick={() => setShowAgentSelector(!showAgentSelector)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  <Bot className="w-5 h-5" />
                  <span className="text-sm font-medium">{aiAgents[selectedAgent].name}</span>
                </button>

                {showAgentSelector && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-purple-500/30 overflow-hidden z-10">
                    {(Object.keys(aiAgents) as AIAgent[]).map((agent) => (
                      <button
                        key={agent}
                        onClick={() => handleAgentChange(agent)}
                        className={`w-full text-left px-4 py-3 hover:bg-purple-500/20 transition-colors border-b border-slate-700/50 last:border-b-0 ${selectedAgent === agent ? 'bg-purple-500/30' : ''}`}
                      >
                        <div className="font-semibold text-white">{aiAgents[agent].name}</div>
                        <div className="text-xs text-purple-200/70 mt-1">{aiAgents[agent].description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20 backdrop-blur-md">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow-md ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-none'
                    : 'bg-white/95 text-gray-900 rounded-bl-none'
                }`}
              >
                <div className={`text-sm md:text-base break-words text-left prose prose-sm max-w-none ${
                  message.sender === 'user'
                    ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-code:text-purple-100 prose-pre:bg-purple-900/50 prose-a:text-purple-200 prose-li:text-white'
                    : 'prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-em:text-gray-700 prose-code:bg-purple-100 prose-code:text-purple-800 prose-pre:bg-gray-100 prose-a:text-purple-600 prose-li:text-gray-900'
                }`}>
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/95 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none shadow-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {error && (
          <div className="bg-red-500/90 text-white px-4 py-2 text-sm flex-shrink-0">
            {error}
          </div>
        )}

        <div className="bg-slate-900/90 backdrop-blur-sm p-4 border-t border-purple-500/30 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-3 rounded-full hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showAuthPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-purple-500/30">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-400/50 mb-4">
                <img
                  src="/images/viajai_pfp.png"
                  alt="ViajAI"
                  className="w-full h-full object-cover scale-150 translate-y-2"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao ViajAI!</h2>
              <p className="text-purple-200 text-center">Para começar, por favor informe seu nome</p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => {
                    setTempUsername(e.target.value)
                    setUsernameError('')
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSaveUsername()
                  }}
                  placeholder="Digite seu nome..."
                  className="w-full bg-slate-800/80 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                  autoFocus
                />
                {usernameError && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {usernameError}
                  </p>
                )}
              </div>
              <button
                onClick={handleSaveUsername}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Começar
              </button>
            </div>
            <p className="text-purple-300/70 text-xs text-center mt-6">
              Seu nome será salvo localmente para personalizar sua experiência
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App