import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateAsset } from '../hooks/use-assets'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { toast } from 'sonner'
import { ArrowRight, Clock, CheckCircle, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'
import type { Asset, AssetStatus } from '@/entities/asset/asset.types'

interface AssetStatusWorkflowProps {
  asset: Asset
  onStatusUpdate: () => void
}

interface StatusTransition {
  from: AssetStatus
  to: AssetStatus
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  requiresNotes?: boolean
  requiresOwner?: boolean
}

const statusTransitions: StatusTransition[] = [
  {
    from: 'Available',
    to: 'In Use',
    label: 'Deploy Asset',
    icon: ArrowRight,
    color: 'text-blue-600',
    requiresOwner: true,
  },
  {
    from: 'Available',
    to: 'Maintenance',
    label: 'Send to Maintenance',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    requiresNotes: true,
  },
  {
    from: 'Available',
    to: 'Reserved',
    label: 'Reserve Asset',
    icon: Clock,
    color: 'text-purple-600',
    requiresOwner: true,
  },
  {
    from: 'In Use',
    to: 'Available',
    label: 'Return Asset',
    icon: RotateCcw,
    color: 'text-green-600',
  },
  {
    from: 'In Use',
    to: 'Maintenance',
    label: 'Send to Maintenance',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    requiresNotes: true,
  },
  {
    from: 'In Use',
    to: 'Retired',
    label: 'Retire Asset',
    icon: XCircle,
    color: 'text-red-600',
    requiresNotes: true,
  },
  {
    from: 'Maintenance',
    to: 'Available',
    label: 'Complete Maintenance',
    icon: CheckCircle,
    color: 'text-green-600',
    requiresNotes: true,
  },
  {
    from: 'Maintenance',
    to: 'Retired',
    label: 'Retire Asset',
    icon: XCircle,
    color: 'text-red-600',
    requiresNotes: true,
  },
  {
    from: 'Reserved',
    to: 'In Use',
    label: 'Deploy Reserved Asset',
    icon: ArrowRight,
    color: 'text-blue-600',
  },
  {
    from: 'Reserved',
    to: 'Available',
    label: 'Cancel Reservation',
    icon: RotateCcw,
    color: 'text-green-600',
  },
]

export function AssetStatusWorkflow({ asset, onStatusUpdate }: AssetStatusWorkflowProps) {
  const [selectedTransition, setSelectedTransition] = useState<StatusTransition | null>(null)
  const [newOwner, setNewOwner] = useState('')
  const [notes, setNotes] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const updateAssetMutation = useUpdateAsset()
  const { canUpdateAllAssets, checkAssetAccess } = usePermissions()

  const canUpdateAsset = canUpdateAllAssets || checkAssetAccess(asset.createdBy)
  const availableTransitions = statusTransitions.filter(t => t.from === asset.status)

  const handleTransitionSelect = (transition: StatusTransition) => {
    setSelectedTransition(transition)
    setNewOwner(transition.requiresOwner ? '' : asset.currentOwner || '')
    setNotes('')
    setIsDialogOpen(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedTransition) return

    try {
      const updateData = {
        id: asset.id,
        status: selectedTransition.to,
        currentOwner: selectedTransition.requiresOwner ? newOwner || undefined :
                     selectedTransition.to === 'Available' ? undefined : asset.currentOwner,
        conditionNotes: notes || asset.conditionNotes,
      }

      if (selectedTransition.requiresOwner && !newOwner) {
        toast.error('Owner is required for this status change')
        return
      }

      if (selectedTransition.requiresNotes && !notes) {
        toast.error('Notes are required for this status change')
        return
      }

      await updateAssetMutation.mutateAsync(updateData)

      toast.success(`Asset ${asset.assetTag} status updated to ${selectedTransition.to}`)
      onStatusUpdate()
      setIsDialogOpen(false)
      setSelectedTransition(null)
    } catch (error) {
      console.error('Failed to update asset status:', error)
      toast.error('Failed to update asset status')
    }
  }

  if (!canUpdateAsset) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Status Workflow</span>
            <span className="text-sm font-normal text-gray-600">
              Current: {asset.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableTransitions.length === 0 ? (
            <p className="text-gray-500 text-sm">No status transitions available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableTransitions.map((transition) => {
                const Icon = transition.icon
                return (
                  <Button
                    key={`${transition.from}-${transition.to}`}
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => handleTransitionSelect(transition)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${transition.color}`} />
                      <div className="text-left">
                        <div className="font-medium">{transition.label}</div>
                        <div className="text-xs text-gray-500">
                          {transition.from} → {transition.to}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTransition?.label}
            </DialogTitle>
          </DialogHeader>
          {selectedTransition && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Updating asset <strong>{asset.assetTag}</strong> from{' '}
                <strong>{selectedTransition.from}</strong> to{' '}
                <strong>{selectedTransition.to}</strong>
              </div>

              {selectedTransition.requiresOwner && (
                <div>
                  <Label htmlFor="newOwner">New Owner *</Label>
                  <Input
                    id="newOwner"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="Enter owner name"
                  />
                </div>
              )}

              {selectedTransition.requiresNotes && (
                <div>
                  <Label htmlFor="notes">Notes *</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this status change"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handleStatusUpdate}
                  disabled={updateAssetMutation.isPending}
                  className="flex-1"
                >
                  {updateAssetMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={updateAssetMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}