import * as React from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { ArrowUp, Minimize2, X } from 'lucide-react'

export interface ChatWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  inputValue: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  onClose?: () => void
  onMinimize?: () => void
  title?: string
}

export function ChatWindow({
  children,
  inputValue,
  onInputChange,
  onSubmit,
  isLoading,
  onClose,
  onMinimize,
  title = "Codexsun AI Assistant",
  className,
  ...props
}: ChatWindowProps) {
  const formRef = React.useRef<HTMLFormElement>(null)
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !isLoading) {
        formRef.current?.requestSubmit()
      }
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-background border shadow-xl rounded-xl overflow-hidden glassmorphism",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-sm tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" onClick={onMinimize}>
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-0 bg-background/50">
        <div className="flex flex-col pb-4">
          {children}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
        <form 
          ref={formRef}
          onSubmit={onSubmit}
          className="relative flex items-center bg-background border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary overflow-hidden transition-all shadow-sm group"
        >
          <Textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent to execute a task..."
            className="min-h-[48px] max-h-32 resize-none border-0 shadow-none focus-visible:ring-0 py-3.5 px-4 pr-12 w-full text-sm"
            rows={1}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className={cn(
              "absolute right-1.5 h-8 w-8 rounded-md transition-all",
              inputValue.trim() ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
            disabled={!inputValue.trim() || isLoading}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
        <div className="text-center mt-2.5 text-[10px] text-muted-foreground/80 font-medium tracking-wide">
          Agents run locally or act on your behalf across MCP Tools.
        </div>
      </div>
    </div>
  )
}
