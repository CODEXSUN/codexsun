import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function useVoiceInput(onTranscript: (value: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const stop = useCallback(() => recognitionRef.current?.stop(), [])
  const start = useCallback(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!Recognition) {
      setVoiceError('Voice input is unavailable in this browser. You can continue typing.')
      return
    }

    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'
    recognition.onresult = (event) => onTranscript(event.results[0]?.[0]?.transcript ?? '')
    recognition.onerror = () => {
      setVoiceError('Microphone access failed. Check browser permission or continue typing.')
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    setVoiceError(null)
    setIsListening(true)
    recognition.start()
  }, [onTranscript])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  return { isListening, start, stop, voiceError }
}

export function speakReply(content: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(content))
}
