import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import './App.css'

interface Message {
  sender: 'user' | 'ai'
  text: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Olá! Sou ViajAI, sua assistente de viagens. Como posso ajudá-lo hoje?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setError(null)

    // Add user message immediately
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }])
    setIsLoading(true)
    const mySessionId = "user-123-travel-session";
    try {
      const response = await fetch('http://localhost:5678/webhook-test/chat-prod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          chatInput: userMessage,
          sessionId: mySessionId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.output || data.message || 'Desculpe, não consegui processar sua mensagem.'

      // Add AI response
      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }])
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Verifique se o webhook está ativo.')
      console.error('Error sending message:', err)
      // Add error message to chat
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
              {/* Profile Picture */}
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
                <p className="text-sm md:text-base break-words text-left">{message.text}</p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/90 text-white px-4 py-2 text-sm flex-shrink-0">
            {error}
          </div>
        )}

        {/* Input Area */}
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
    </div>
  )
}

export default App
