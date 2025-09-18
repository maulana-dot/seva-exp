import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAssets, useCreateAsset } from '../hooks/use-assets'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { assetsToCSV, downloadCSV, parseCSV, csvRowToAssetInput } from '@/utils/csv-utils'
import { toast } from 'sonner'
import { Download, Upload, FileSpreadsheet } from 'lucide-react'

export function CSVImportExport() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: assets = [] } = useAssets()
  const createAssetMutation = useCreateAsset()
  const { canCreateAssets } = usePermissions()

  const handleExport = () => {
    if (assets.length === 0) {
      toast.error('No assets to export')
      return
    }

    try {
      const csvContent = assetsToCSV(assets)
      const filename = `assets-export-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
      toast.success(`Exported ${assets.length} assets to ${filename}`)
    } catch (error) {
      toast.error('Failed to export assets')
      console.error('Export error:', error)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a CSV file')
      return
    }

    setIsImporting(true)

    try {
      const csvContent = await importFile.text()
      const rows = parseCSV(csvContent)

      let successCount = 0
      let errorCount = 0

      for (const row of rows) {
        try {
          const assetInput = csvRowToAssetInput(row)
          await createAssetMutation.mutateAsync(assetInput)
          successCount++
        } catch (error) {
          errorCount++
          console.error('Failed to import row:', row, error)
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} assets`)
      }

      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} assets`)
      }

      setIsImportDialogOpen(false)
      setImportFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast.error('Failed to parse CSV file')
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setImportFile(file)
    } else {
      toast.error('Please select a valid CSV file')
      setImportFile(null)
    }
  }

  const downloadTemplate = () => {
    const templateContent = [
      'Device photo,Asset tag,Status,Manufacturer,Model,Asset type,Color,Serial number,Purchase date,Purchase price,Order #,Current owner,Previous owner,Due date,Condition notes',
      ',EXAMPLE-001,Available,Microsoft,Surface Laptop 5,Laptop,Silver,123ABC456DEF,2024-01-15,$1299.99,PO-2024-001,,,2025-01-15,Excellent condition',
    ].join('\n')

    downloadCSV(templateContent, 'asset-import-template.csv')
    toast.success('Template downloaded')
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Export Button */}
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={assets.length === 0}
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>Export CSV</span>
      </Button>

      {/* Import Button */}
      {canCreateAssets && (
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Import CSV</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import Assets from CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvFile">Select CSV File</Label>
                <Input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isImporting}
                />
              </div>

              {importFile && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{importFile.name}</p>
                        <p className="text-xs text-gray-600">
                          {(importFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="flex-1"
                >
                  {isImporting ? 'Importing...' : 'Import Assets'}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  disabled={isImporting}
                >
                  Template
                </Button>
              </div>

              <div className="text-xs text-gray-600">
                <p>• CSV must include all required columns</p>
                <p>• Download template for correct format</p>
                <p>• Existing assets with same asset tag will not be imported</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}