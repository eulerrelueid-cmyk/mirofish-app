'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowRight, ChevronDown, FileText, Upload, X } from 'lucide-react'

interface ScenarioInputProps {
  onSubmit: (title: string, description: string, seedText?: string, file?: File) => void
  isLoading: boolean
}

const examplePrompts = [
  'Will an AI-first product launch trigger trust concerns or rapid adoption?',
  'How does a policy rumor spread across technical, media, and investor groups?',
  'Which narrative wins when a competitor undercuts pricing in public?',
]

export function ScenarioInput({ onSubmit, isLoading }: ScenarioInputProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [seedText, setSeedText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (title && description) {
      onSubmit(title, description, seedText || undefined, uploadedFile || undefined)
    }
  }

  return (
    <div className="glass-panel rounded-[28px] p-5 sm:p-6 glow-border">
      <div className="mb-5">
        <div className="section-label mb-3">New run</div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Start a simulation</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
          Describe the scenario you want tested. Add grounding only if the run needs more context.
        </p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {examplePrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setDescription(prompt)}
            className="min-w-[220px] rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">Scenario title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="AI pricing shock across enterprise buyers"
            className="w-full rounded-[20px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-miro-accent focus:outline-none focus:ring-2 focus:ring-miro-accent/25 sm:text-base"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">What should the swarm predict?</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the trigger, the audience, and the outcome you want the agents to react to."
            rows={5}
            className="w-full resize-none rounded-[22px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-miro-accent focus:outline-none focus:ring-2 focus:ring-miro-accent/25 sm:text-base"
            required
          />
        </div>

        <details className="group rounded-[22px] border border-white/10 bg-black/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Optional context</p>
              <p className="text-sm text-slate-400">Paste notes or upload one document if you want the run anchored.</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition-transform group-open:rotate-180">
              <ChevronDown className="h-4 w-4" />
            </div>
          </summary>

          <div className="grid gap-4 border-t border-white/10 px-4 pb-4 pt-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">Seed text</label>
              <textarea
                value={seedText}
                onChange={(event) => setSeedText(event.target.value)}
                placeholder="Paste research notes, quotes, or signals."
                rows={6}
                className="w-full resize-none rounded-[20px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-miro-accent focus:outline-none focus:ring-2 focus:ring-miro-accent/25"
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">Upload document</label>
              {uploadedFile ? (
                <div className="flex min-h-[164px] items-center justify-between rounded-[22px] border border-miro-accent/30 bg-miro-accent/10 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/25">
                      <FileText className="h-5 w-5 text-miro-accent" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium text-white">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(1)} KB attached</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="rounded-xl border border-white/10 bg-black/20 p-2 transition-colors hover:bg-black/35"
                    aria-label="Remove uploaded file"
                  >
                    <X className="h-4 w-4 text-slate-300" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`flex min-h-[164px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed p-5 text-center transition-all ${
                    isDragActive ? 'border-miro-accent bg-miro-accent/10' : 'border-white/15 bg-black/25 hover:border-white/30 hover:bg-black/35'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Upload className={`h-5 w-5 ${isDragActive ? 'text-miro-accent' : 'text-slate-400'}`} />
                  </div>
                  <p className="text-sm font-medium text-white">
                    {isDragActive ? 'Drop the file here' : 'Drop a file or tap to browse'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">PDF, DOCX, or TXT</p>
                </div>
              )}
            </div>
          </div>
        </details>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-7 text-slate-400">
            Keep the first pass simple. If the output feels too generic, add context and run it again.
          </p>
          <button
            type="submit"
            disabled={isLoading || !title || !description}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-miro-accent via-miro-teal to-miro-glow px-5 py-3 text-sm font-semibold text-slate-950 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(114,224,197,0.22)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/25 border-t-slate-950" />
                Running simulation
              </>
            ) : (
              <>
                Start simulation
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
