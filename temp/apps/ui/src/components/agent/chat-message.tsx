import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn } from '../../lib/utils'
import { Bot, User } from 'lucide-react'

export interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: 'user' | 'assistant' | 'system'
  content: string
  avatarUrl?: string
  toolCalls?: Array<{ id: string; name: string }>
}

export function ChatMessage({
  role,
  content,
  avatarUrl,
  toolCalls,
  className,
  ...props
}: ChatMessageProps) {
  const isUser = role === 'user'
  
  return (
    <div
      className={cn(
        "flex w-full gap-4 px-6 py-6 text-sm",
        isUser ? "bg-background" : "bg-muted/30",
        className
      )}
      {...props}
    >
      <Avatar className="h-8 w-8 shrink-0 shadow-sm border">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 font-semibold">
          {isUser ? 'You' : 'Codexsun Agent'}
        </div>
        
        {toolCalls && toolCalls.length > 0 && (
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-1 mb-2">
            {toolCalls.map((tool) => (
              <div key={tool.id} className="flex items-center gap-2 bg-muted/50 border rounded-md px-2.5 py-1.5 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-mono">executing {tool.name}...</span>
              </div>
            ))}
          </div>
        )}
        
        {content && (
          <div className="prose prose-sm dark:prose-invert break-words leading-relaxed max-w-none">
            {content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i !== content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
