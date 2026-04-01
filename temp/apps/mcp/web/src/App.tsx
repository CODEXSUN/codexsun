import { useState } from 'react'
import { ChatWindow, ChatMessage, AgentThinking } from '@ui/index'

export default function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string, toolCalls?: { id: string, name: string }[] }>>([
    { role: 'assistant', content: 'Connection established to MCP local framework. I run directly against your codexsun runtime. \n\nWaiting for you to connect the agent hooks.' }
  ])
  const [isThinking, setIsThinking] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setMessages(prev => [...prev, { role: 'user', content: input }])
    setInput('')
    setIsThinking(true)

    // Example mock logic until the API hooks are attached 
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: '', 
          toolCalls: [{ id: 'req_123', name: 'search_knowledge_items' }] 
        }
      ])
      
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: 'I have retrieved the layout information. I can now assist with further platform operations!' 
          }
        ])
        setIsThinking(false)
      }, 1500)
    }, 1000)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-4xl h-[85vh] flex">
        <ChatWindow
          title="Codexsun Agent Interface"
          inputValue={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isThinking}
          className="w-full h-full border shadow-2xl rounded-2xl"
        >
          {messages.map((msg, i) => (
            <ChatMessage 
              key={i} 
              role={msg.role} 
              content={msg.content} 
              toolCalls={msg.toolCalls} 
            />
          ))}
          {isThinking && <AgentThinking />}
        </ChatWindow>
      </div>
    </div>
  )
}
