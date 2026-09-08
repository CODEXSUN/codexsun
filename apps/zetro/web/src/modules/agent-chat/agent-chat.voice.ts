import { useCallback, useEffect, useRef, useState } from 'react'

type RecognitionEvent = { results: ArrayLike<{ 0: { transcript: string } }> }

type Recognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: RecognitionEvent) => void) | null
  start(): void
  stop(): void
}

type RecognitionConstructor = new () => Recognition

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
}

export function useVoiceInput(onTranscript: (value: string) => void) {
  const recognitionRef = useRef<Recognition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  const stop = useCallback(() => recognitionRef.current?.stop(), [])
  const start = useCallback(() => {
    const RecognitionApi = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!RecognitionApi) {
      setError('Voice input is unavailable in this browser.')
      return
    }

    const recognition = new RecognitionApi()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'
    recognition.onresult = (event) => onTranscript(event.results[0]?.[0]?.transcript ?? '')
    recognition.onerror = () => {
      setError('Microphone access failed. You can continue typing.')
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    setError(null)
    setIsListening(true)
    recognition.start()
  }, [onTranscript])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  return { error, isListening, start, stop }
}
