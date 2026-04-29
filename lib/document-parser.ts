import { mergeScenarioGrounding } from './scenario-request.ts'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const MAX_EXTRACTED_CHARACTERS = 18_000

const SUPPORTED_FILE_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

export class DocumentParserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentParserError'
  }
}

function normalizeExtractedText(value: string) {
  return value.replace(/\r\n/g, '\n').replace(/\u0000/g, '').trim()
}

function truncateExtractedText(value: string) {
  if (value.length <= MAX_EXTRACTED_CHARACTERS) {
    return value
  }

  return `${value.slice(0, MAX_EXTRACTED_CHARACTERS).trim()}\n\n[Document truncated for simulation input]`
}

function isSupportedFileType(type: string, name: string) {
  if (SUPPORTED_FILE_TYPES.has(type)) {
    return true
  }

  const lowerName = name.toLowerCase()
  return lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.txt')
}

async function extractPdfText(buffer: Buffer) {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })

  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

async function extractDocxText(buffer: Buffer) {
  const mammoth = await import('mammoth')
  const result = await mammoth.default.extractRawText({ buffer })
  return result.value
}

async function extractTextByType(file: File, buffer: Buffer) {
  const lowerName = file.name.toLowerCase()

  if (file.type === 'text/plain' || lowerName.endsWith('.txt')) {
    return buffer.toString('utf8')
  }

  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return extractPdfText(buffer)
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    return extractDocxText(buffer)
  }

  throw new Error(`Unsupported file type: ${file.type || file.name}`)
}

export interface ParsedScenarioUpload {
  extractedText: string
  metadata: {
    name: string
    type: string
    size: number
    extractedCharacters: number
  }
}

export async function parseUploadedScenarioFile(file: File): Promise<ParsedScenarioUpload> {
  if (!isSupportedFileType(file.type, file.name)) {
    throw new DocumentParserError('Unsupported file type. Upload a PDF, DOCX, or TXT file.')
  }

  if (file.size === 0) {
    throw new DocumentParserError('Uploaded file was empty.')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new DocumentParserError('Uploaded file is too large. Keep files under 8 MB.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const extractedText = truncateExtractedText(normalizeExtractedText(await extractTextByType(file, buffer)))

  if (!extractedText) {
    throw new DocumentParserError('No readable text could be extracted from the uploaded file.')
  }

  return {
    extractedText,
    metadata: {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      extractedCharacters: extractedText.length,
    },
  }
}

export { mergeScenarioGrounding }
