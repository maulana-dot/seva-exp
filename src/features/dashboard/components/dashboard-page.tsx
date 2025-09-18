import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFormsDashboardStats } from '../hooks/use-forms-dashboard-stats'
import { formatDateTime } from '@/utils/date-format'
import { FileText, Send, Activity, TrendingUp, Plus, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'

export default function DashboardPage() {
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  const { data: stats, isLoading } = useFormsDashboardStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Overview of your form management activities</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Overview of your form management activities</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/form-builder/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/forms">
                <Eye className="h-4 w-4 mr-2" />
                View All Forms
              </Link>
            </Button>
          </div>
        </div>
        <div className="text-center py-16">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Overview of your form management activities</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/form-builder/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/forms">
              <Eye className="h-4 w-4 mr-2" />
              View All Forms
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalForms}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'All forms in system' : 'Your forms'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeForms}</div>
            <p className="text-xs text-muted-foreground">
              Currently accepting responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Responses received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyGrowth.submissionsReceived}</div>
            <p className="text-xs text-muted-foreground">
              New submissions ({stats.monthlyGrowth.formsCreated} new forms)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPerformingForms.length === 0 ? (
                <p className="text-gray-500 text-sm">No forms with submissions yet</p>
              ) : (
                stats.topPerformingForms.map((form, index) => (
                  <div key={form.formId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate max-w-48">
                        {form.formTitle}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {form.submissionCount} responses
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentForms.length === 0 ? (
                <p className="text-gray-500 text-sm">No forms created yet</p>
              ) : (
                stats.recentForms.map((form) => (
                  <div key={form.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-48">{form.title}</p>
                        <p className="text-xs text-gray-600">
                          {formatDateTime(form.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={form.isActive ? 'default' : 'secondary'} className="text-xs">
                      {form.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-600 truncate">
                        by {activity.userEmail}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSubmissions.length === 0 ? (
                <p className="text-gray-500 text-sm">No submissions yet</p>
              ) : (
                stats.recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{submission.formTitle}</p>
                      <p className="text-xs text-gray-600">
                        {submission.submittedBy ? `Submitted by user` : 'Anonymous submission'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(submission.submittedAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}