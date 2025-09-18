import { formatDate, formatDateForInput } from './date-format'
import { formatCurrency } from './number-format'
import type { Asset, CreateAssetInput } from '@/entities/asset/asset.types'

interface CSVAssetRow {
  'Device photo': string
  'Asset tag': string
  'Status': string
  'Manufacturer': string
  'Model': string
  'Asset type': string
  'Color': string
  'Serial number': string
  'Purchase date': string
  'Purchase price': string
  'Order #': string
  'Current owner': string
  'Previous owner': string
  'Due date': string
  'Condition notes': string
}

export function assetsToCSV(assets: Asset[]): string {
  const headers = [
    'Device photo',
    'Asset tag',
    'Status',
    'Manufacturer',
    'Model',
    'Asset type',
    'Color',
    'Serial number',
    'Purchase date',
    'Purchase price',
    'Order #',
    'Current owner',
    'Previous owner',
    'Due date',
    'Condition notes',
  ]

  const rows = assets.map((asset) => [
    asset.devicePhoto || '',
    asset.assetTag,
    asset.status,
    asset.manufacturer,
    asset.model,
    asset.assetType,
    asset.color,
    asset.serialNumber,
    formatDate(asset.purchaseDate),
    formatCurrency(asset.purchasePrice),
    asset.orderNumber,
    asset.currentOwner || '',
    asset.previousOwner || '',
    asset.dueDate ? formatDate(asset.dueDate) : '',
    asset.conditionNotes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((field) => {
        // Escape fields that contain commas, quotes, or newlines
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`
        }
        return field
      }).join(',')
    ),
  ].join('\n')

  return csvContent
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current)
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }

  result.push(current)
  return result
}

export function parseCSV(csvContent: string): CSVAssetRow[] {
  const lines = csvContent.split('\n').filter((line) => line.trim())

  if (lines.length < 2) {
    throw new Error('CSV file must contain headers and at least one data row')
  }

  const headers = parseCSVLine(lines[0])
  const expectedHeaders = [
    'Device photo',
    'Asset tag',
    'Status',
    'Manufacturer',
    'Model',
    'Asset type',
    'Color',
    'Serial number',
    'Purchase date',
    'Purchase price',
    'Order #',
    'Current owner',
    'Previous owner',
    'Due date',
    'Condition notes',
  ]

  // Validate headers
  const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
  }

  const rows: CSVAssetRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])

    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}`)
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })

    rows.push(row as CSVAssetRow)
  }

  return rows
}

export function csvRowToAssetInput(row: CSVAssetRow): CreateAssetInput {
  const purchasePrice = parseFloat(row['Purchase price'].replace(/[$,]/g, '')) || 0

  // Parse dates
  const purchaseDate = new Date(row['Purchase date'])
  const dueDate = row['Due date'] ? new Date(row['Due date']) : undefined

  // Validate required fields
  if (!row['Asset tag']) {
    throw new Error('Asset tag is required')
  }
  if (!row['Manufacturer']) {
    throw new Error('Manufacturer is required')
  }
  if (!row['Model']) {
    throw new Error('Model is required')
  }
  if (!row['Serial number']) {
    throw new Error('Serial number is required')
  }
  if (isNaN(purchaseDate.getTime())) {
    throw new Error('Invalid purchase date')
  }

  return {
    assetTag: row['Asset tag'],
    status: row['Status'] as any, // Will be validated by the form schema
    manufacturer: row['Manufacturer'],
    model: row['Model'],
    assetType: row['Asset type'] as any, // Will be validated by the form schema
    color: row['Color'],
    serialNumber: row['Serial number'],
    purchaseDate,
    purchasePrice,
    orderNumber: row['Order #'],
    currentOwner: row['Current owner'] || undefined,
    dueDate,
    conditionNotes: row['Condition notes'] || undefined,
  }
}