export interface ParsedScenarioUpload {
  extractedText: string
  metadata: {
    name: string
    type: string
    size: number
    extractedCharacters: number
  }
}

export interface ParsedMultipartScenarioRequest {
  title: string
  description: string
  seedText?: string
  userId: string | null
  uploadedFile: ParsedScenarioUpload | null
  combinedSeedText?: string
}

export function normalizeScenarioField(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed || undefined
}

export function mergeScenarioGrounding(seedText?: string, upload?: ParsedScenarioUpload) {
  const sections = [seedText?.trim()]

  if (upload) {
    sections.push(`Document grounding (${upload.metadata.name}):\n${upload.extractedText}`)
  }

  const merged = sections.filter((value): value is string => Boolean(value)).join('\n\n')
  return merged || undefined
}

export async function parseMultipartScenarioFormData(
  formData: FormData,
  parseUploadedFile: (file: File) => Promise<ParsedScenarioUpload>
): Promise<ParsedMultipartScenarioRequest> {
  const title = normalizeScenarioField(formData.get('title'))
  const description = normalizeScenarioField(formData.get('description'))
  const seedText = normalizeScenarioField(formData.get('seedText'))
  const userId = normalizeScenarioField(formData.get('userId')) ?? null
  const fileValue = formData.get('file')
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null
  const uploadedFile = file ? await parseUploadedFile(file) : null

  return {
    title: title ?? '',
    description: description ?? '',
    seedText,
    userId,
    uploadedFile,
    combinedSeedText: mergeScenarioGrounding(seedText, uploadedFile ?? undefined),
  }
}
