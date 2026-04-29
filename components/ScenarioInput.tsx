'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowRight, ChevronDown, FileText, Upload, X } from 'lucide-react'

interface ScenarioInputProps {
  onSubmit: (title: string, description: string, seedText?: string, file?: File) => void
  isLoading: boolean
}

const examplePrompts = [
  {
    label: 'Product launch',
    title: 'AI product launch',
    prompt: 'Will an AI-first product launch trigger trust concerns or fast adoption?',
  },
  {
    label: 'Policy rumor',
    title: 'Policy rumor spread',
    prompt: 'How does a policy rumor spread across technical, media, and investor groups?',
  },
  {
    label: 'Price cut',
    title: 'Competitor price cut',
    prompt: 'Which narrative wins when a competitor cuts pricing in public?',
  },
] as const

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
    <section className="glass-panel rounded-[32px] p-5 sm:p-6 lg:p-7">
      <div className="mb-5">
        <div>
          <div className="section-label">Prompt</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">New simulation</h2>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {examplePrompts.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => {
              setTitle(example.title)
              setDescription(example.prompt)
            }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-left text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            {example.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">Scenario title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="AI pricing shock across enterprise buyers"
              className="w-full rounded-[20px] border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:border-miro-accent focus:outline-none focus:ring-2 focus:ring-miro-accent/25 sm:text-base"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">Prompt</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the trigger, audience, and question to test."
              rows={5}
              className="w-full resize-none rounded-[24px] border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:border-miro-accent focus:outline-none focus:ring-2 focus:ring-miro-accent/25 sm:text-base"
              required
            />
          </div>
        </div>

        <details className="group rounded-[24px] border border-white/10 bg-black/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Grounding</p>
              <p className="text-sm text-slate-500">Optional notes or one file.</p>
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
                placeholder="Notes, quotes, or context."
                rows={6}
                className="w-full resize-none rounded-[22px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-miro-accent focus:outline-none focus:ring-2 focus:ring-miro-accent/25"
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">Upload document</label>
              {uploadedFile ? (
                <div className="flex min-h-[164px] items-center justify-between rounded-[24px] border border-miro-accent/30 bg-miro-accent/10 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/25">
                      <FileText className="h-5 w-5 text-miro-accent" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium text-white">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
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
                  className={`flex min-h-[164px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed p-5 text-center transition-all ${
                    isDragActive
                      ? 'border-miro-accent bg-miro-accent/10'
                      : 'border-white/[0.15] bg-black/25 hover:border-white/30 hover:bg-black/35'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Upload className={`h-5 w-5 ${isDragActive ? 'text-miro-accent' : 'text-slate-400'}`} />
                  </div>
                  <p className="text-sm font-medium text-white">{isDragActive ? 'Drop file' : 'Drop or browse'}</p>
                  <p className="mt-1 text-xs text-slate-500">PDF, DOCX, or TXT</p>
                </div>
              )}
            </div>
          </div>
        </details>

        <div className="flex justify-end border-t border-white/10 pt-5">
          <button
            type="submit"
            disabled={isLoading || !title || !description}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/25 border-t-slate-950" />
                Running
              </>
            ) : (
              <>
                Run
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
