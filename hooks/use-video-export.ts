"use client"

import { useRef, useCallback, useState } from "react"

interface ExportState {
  isRecording: boolean
  progress: number
  error: string | null
}

export function useVideoExport() {
  const [state, setState] = useState<ExportState>({
    isRecording: false,
    progress: 0,
    error: null,
  })
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const startRecording = useCallback((canvas: HTMLCanvasElement) => {
    try {
      chunksRef.current = []
      const stream = canvas.captureStream(30) // 30 FPS

      // Try WebM with VP9, fall back to VP8
      let mimeType = "video/webm;codecs=vp9"
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8"
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm"
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.start(100) // collect data every 100ms
      recorderRef.current = recorder

      setState({ isRecording: true, progress: 0, error: null })
    } catch (err) {
      setState({
        isRecording: false,
        progress: 0,
        error: `Recording failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      })
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === "inactive") {
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        chunksRef.current = []
        setState({ isRecording: false, progress: 1, error: null })
        resolve(blob)
      }

      recorder.stop()
    })
  }, [])

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const setProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, progress }))
  }, [])

  return {
    ...state,
    startRecording,
    stopRecording,
    downloadBlob,
    setProgress,
  }
}
