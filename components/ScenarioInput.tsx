'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Sparkles, X } from 'lucide-react'

interface ScenarioInputProps {
  onSubmit: (title: string, description: string, seedText?: string, file?: File) => void
  isLoading: boolean
}

export function ScenarioInput({ onSubmit, isLoading }: ScenarioInputProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [seedText, setSeedText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setUploadedFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title && description) {
      onSubmit(title, description, seedText || undefined, uploadedFile || undefined)
    }
  }

  return (
    <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 glow-border">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-miro-teal to-miro-accent flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold">Create Simulation</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Scenario Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., AI Adoption in Enterprise"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-black/30 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-miro-accent focus:ring-1 focus:ring-miro-accent transition-all"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">What do you want to predict?</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your prediction scenario..."
            rows={3}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-black/30 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-miro-accent focus:ring-1 focus:ring-miro-accent transition-all resize-none"
            required
          />
        </div>

        {/* Seed Text & File Upload - Stack on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Seed Text (Optional)</label>
            <textarea
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              placeholder="Paste relevant context..."
              rows={4}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-black/30 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-miro-accent focus:ring-1 focus:ring-miro-accent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Upload Document (Optional)</label>
            {uploadedFile ? (
              <div className="h-[calc(100%-2rem)] min-h-[100px] rounded-lg sm:rounded-xl bg-black/30 border border-miro-teal/50 p-3 sm:p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-miro-teal/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-miro-teal" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-400">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setUploadedFile(null)} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`h-[calc(100%-2rem)] min-h-[100px] rounded-lg sm:rounded-xl border-2 border-dashed p-3 sm:p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragActive ? 'border-miro-accent bg-miro-accent/10' : 'border-white/20 hover:border-white/40 bg-black/30'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className={`w-6 h-6 sm:w-8 sm:h-8 mb-1.5 sm:mb-2 ${isDragActive ? 'text-miro-accent' : 'text-gray-500'}`} />
                <p className="text-xs sm:text-sm text-gray-400 text-center">
                  {isDragActive ? 'Drop file here' : 'Tap to upload'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">PDF, DOC, TXT</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !title || !description}
          className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-miro-accent to-miro-glow text-white font-semibold text-base sm:text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-sm sm:text-base">Running...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Start Simulation</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
