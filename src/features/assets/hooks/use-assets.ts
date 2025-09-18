import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AssetService } from '../services/asset.service'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import type {
  Asset,
  AssetId,
  CreateAssetInput,
  UpdateAssetInput,
  AssetFilters,
} from '@/entities/asset/asset.types'

const QUERY_KEYS = {
  assets: ['assets'] as const,
  asset: (id: AssetId) => ['assets', id] as const,
}

export function useAssets(filters?: AssetFilters) {
  const { user } = useAuth()
  const { canReadAllAssets } = usePermissions()

  return useQuery({
    queryKey: [...QUERY_KEYS.assets, filters],
    queryFn: () => AssetService.getAssets(filters, user?.id, canReadAllAssets),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAsset(assetId: AssetId) {
  return useQuery({
    queryKey: QUERY_KEYS.asset(assetId),
    queryFn: () => AssetService.getAsset(assetId),
    enabled: !!assetId,
  })
}

export function useCreateAsset() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAssetInput) => {
      if (!user) throw new Error('User not authenticated')
      return AssetService.createAsset(input, user.id, user.email)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets })
      toast.success('Asset created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create asset')
    },
  })
}

export function useUpdateAsset() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateAssetInput) => {
      if (!user) throw new Error('User not authenticated')
      return AssetService.updateAsset(input, user.id, user.email)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.asset(variables.id) })
      toast.success('Asset updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update asset')
    },
  })
}

export function useDeleteAsset() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assetId: AssetId) => {
      if (!user) throw new Error('User not authenticated')
      return AssetService.deleteAsset(assetId, user.id, user.email)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets })
      toast.success('Asset deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete asset')
    },
  })
}