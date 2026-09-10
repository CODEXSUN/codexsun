import { useEffect, useRef } from 'react'

/** Follow updates only while the reader remains near the end of the scroll viewport. */
export function useScrollFollow(update: unknown, resetKey: unknown) {
  const endRef = useRef<HTMLDivElement>(null)
  const following = useRef(true)
  useEffect(() => {
    const viewport = endRef.current?.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')
    if (!viewport) return
    following.current = true
    endRef.current?.scrollIntoView({ block: 'end' })
    const onScroll = () => {
      following.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80
    }
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [resetKey])
  useEffect(() => {
    if (following.current) endRef.current?.scrollIntoView({ block: 'end' })
  }, [update])
  return endRef
}
