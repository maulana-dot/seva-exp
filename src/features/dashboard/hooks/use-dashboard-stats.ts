import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import type { Asset, AssetStatus, AssetType } from '@/entities/asset/asset.types'

interface DashboardStats {
  totalAssets: number
  totalValue: number
  statusDistribution: Record<AssetStatus, number>
  typeDistribution: Record<AssetType, number>
  recentActivity: Array<{
    id: string
    type: 'created' | 'updated' | 'status_change'
    assetTag: string
    description: string
    timestamp: Date
  }>
  maintenanceDue: number
  availableAssets: number
}

export function useDashboardStats() {
  const { user } = useAuth()
  const { canReadAllAssets } = usePermissions()

  return useQuery({
    queryKey: ['dashboard-stats', user?.id, canReadAllAssets],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('User not authenticated')

      const assetsRef = collection(db, 'assets')
      let assetsQuery

      // Apply RBAC: if user can't read all assets, filter by created by user
      if (canReadAllAssets) {
        assetsQuery = query(assetsRef)
      } else {
        assetsQuery = query(assetsRef, where('createdBy', '==', user.id))
      }

      const snapshot = await getDocs(assetsQuery)
      const assets: Asset[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        assets.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          purchaseDate: data.purchaseDate?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || null,
        } as Asset)
      })

      // Calculate statistics
      const totalAssets = assets.length
      const totalValue = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)

      const statusDistribution: Record<AssetStatus, number> = {
        'Available': 0,
        'In Use': 0,
        'Maintenance': 0,
        'Reserved': 0,
        'Retired': 0,
      }

      const typeDistribution: Record<AssetType, number> = {
        'Laptop': 0,
        'Desktop': 0,
        'Monitor': 0,
        'Phone': 0,
        'Tablet': 0,
        'Printer': 0,
        'Other': 0,
      }

      let maintenanceDue = 0
      let availableAssets = 0

      assets.forEach((asset) => {
        statusDistribution[asset.status]++
        typeDistribution[asset.assetType]++

        if (asset.status === 'Available') {
          availableAssets++
        }

        // Check if maintenance is due (based on dueDate)
        if (asset.dueDate && asset.dueDate <= new Date()) {
          maintenanceDue++
        }
      })

      // Generate recent activity (mock data based on assets)
      const recentActivity = assets
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5)
        .map((asset) => ({
          id: asset.id,
          type: 'updated' as const,
          assetTag: asset.assetTag,
          description: `Asset ${asset.assetTag} was updated`,
          timestamp: asset.updatedAt,
        }))

      return {
        totalAssets,
        totalValue,
        statusDistribution,
        typeDistribution,
        recentActivity,
        maintenanceDue,
        availableAssets,
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}