import * as React from 'react'
import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

export function AgentThinking({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-6 py-4 text-muted-foreground", className)}>
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-current opacity-60"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-current opacity-60"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-current opacity-60"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
      <span className="ml-2 text-xs font-medium tracking-tight">Agent thinking...</span>
    </div>
  )
}
