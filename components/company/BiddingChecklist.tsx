'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { 
  CheckCircle, 
  AlertTriangle, 
  Save, 
  RefreshCw,
  FileText,
  Building2,
  MapPin,
  Globe,
  Award,
  Edit3
} from 'lucide-react'
import { CHECKLIST_CATEGORIES, getChecklistProgress } from '@/lib/checklist-data'
import { CompanyChecklist } from '@/types/checklist'

interface BiddingChecklistProps {
  companyId: string
  canManage: boolean
}

export default function BiddingChecklist({ companyId, canManage }: BiddingChecklistProps) {
  const [checklist, setChecklist] = useState<CompanyChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0, byCategory: {} })
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadChecklist()
  }, [companyId])

  useEffect(() => {
    if (checklist) {
      setProgress(getChecklistProgress(checklist))
    }
  }, [checklist])

  const loadChecklist = async () => {
    try {
      setLoading(true)
      
      // Try to get existing checklist
      const { data: existingChecklist } = await supabase
        .from('company_checklist')
        .select('*')
        .eq('company_id', companyId)
        .single()

      if (existingChecklist) {
        setChecklist(existingChecklist)
      } else {
        // Create new checklist with default values
        const { data: newChecklist, error } = await supabase
          .from('company_checklist')
          .insert({
            company_id: companyId,
            // All boolean fields default to false
          })
          .select()
          .single()

        if (error) throw error
        setChecklist(newChecklist)
      }
    } catch (error) {
      console.error('Error loading checklist:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bidding checklist',
        variant: 'destructive'})
    } finally {
      setLoading(false)
    }
  }

  const handleCheckboxChange = async (field: keyof CompanyChecklist, checked: boolean) => {
    if (!checklist || !canManage) return

    try {
      setSaving(true)
      
      const updatedChecklist = { ...checklist, [field]: checked }
      setChecklist(updatedChecklist)

      // Auto-save to Supabase
      const { error } = await supabase
        .from('company_checklist')
        .update({ [field]: checked, last_updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq('company_id', companyId)

      if (error) throw error

      // Show success toast for visual feedback
      toast({
        title: 'Saved',
        description: 'Checklist updated successfully'})
    } catch (error) {
      console.error('Error updating checklist:', error)
      toast({
        title: 'Error',
        description: 'Failed to save checklist item',
        variant: 'destructive'})
      // Revert the change on error
      setChecklist(checklist)
    } finally {
      setSaving(false)
    }
  }

  const handleTextInputChange = async (field: keyof CompanyChecklist, value: string) => {
    if (!checklist || !canManage) return

    try {
      setSaving(true)
      
      const updatedChecklist = { ...checklist, [field]: value }
      setChecklist(updatedChecklist)

      // Auto-save to Supabase
      const { error } = await supabase
        .from('company_checklist')
        .update({ [field]: value, last_updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq('company_id', companyId)

      if (error) throw error

      // Show success toast for visual feedback
      toast({
        title: 'Saved',
        description: 'Text field updated successfully'})
    } catch (error) {
      console.error('Error updating text field:', error)
      toast({
        title: 'Error',
        description: 'Failed to save text field',
        variant: 'destructive'})
      // Revert the change on error
      setChecklist(checklist)
    } finally {
      setSaving(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    if (percentage >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getProgressText = (percentage: number) => {
    if (percentage >= 80) return 'Excellent! Your profile is nearly complete.'
    if (percentage >= 60) return 'Good progress! Keep completing the remaining items.'
    if (percentage >= 40) return 'You\'re making progress. Focus on completing more items.'
    return 'Get started by completing the essential items below.'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading checklist...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!checklist) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load checklist</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your bidding checklist.
            </p>
            <Button onClick={loadChecklist}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Bidding Checklist Progress
          </CardTitle>
          <CardDescription>
            Track your compliance requirements for government contracting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm font-medium">{progress.completed}/{progress.total} ({progress.percentage}%)</span>
            </div>
            <Progress value={progress.percentage} className="h-3" />
            <p className="text-sm text-muted-foreground">{getProgressText(progress.percentage)}</p>
          </div>

          {/* Progress by Category */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CHECKLIST_CATEGORIES.map((category) => {
              const categoryProgress = (progress.byCategory as Record<string, number>)[category.name] || 0
              const categoryTotal = category.items.length
              const categoryPercentage = categoryTotal > 0 ? Math.round((categoryProgress / categoryTotal) * 100) : 0
              
              return (
                <div key={category.name} className="text-center p-3 rounded-lg border">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${category.color}`}>
                    {category.name}
                  </div>
                  <div className="text-2xl font-bold">{categoryProgress}/{categoryTotal}</div>
                  <div className="text-sm text-muted-foreground">{categoryPercentage}%</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Incomplete Profile Alert */}
      {progress.percentage < 100 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Complete your profile:</strong> You have {progress.total - progress.completed} items remaining. 
            Completing your checklist will improve your chances of winning government contracts.
          </AlertDescription>
        </Alert>
      )}

      {/* Checklist Categories */}
      <div className="space-y-6">
        {CHECKLIST_CATEGORIES.map((category) => (
          <Card key={category.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.name === 'State' && <Building2 className="h-5 w-5" />}
                {category.name === 'County' && <MapPin className="h-5 w-5" />}
                {category.name === 'City' && <MapPin className="h-5 w-5" />}
                {category.name === 'All' && <Globe className="h-5 w-5" />}
                {category.name} Requirements
                <Badge variant="outline" className={category.color}>
                  {category.items.length} items
                </Badge>
              </CardTitle>
              <CardDescription>
                Required documentation and certifications for {category.name.toLowerCase()} contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.id} className="space-y-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    {/* Text Input */}
                    {item.inputType === 'text' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-blue-600" />
                          <label className="text-sm font-medium">{item.label}</label>
                          {item.required && <span className="text-red-500">*</span>}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <Input
                          value={checklist[item.field] as string || ''}
                          onChange={(e) => handleTextInputChange(item.field, e.target.value)}
                          placeholder={item.placeholder}
                          disabled={!canManage || saving}
                          className="mt-2"
                        />
                        {checklist[item.field] && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Value saved</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Date Input */}
                    {item.inputType === 'date' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-blue-600" />
                          <label className="text-sm font-medium">{item.label}</label>
                          {item.required && <span className="text-red-500">*</span>}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <Input
                          type="date"
                          value={checklist[item.field] as string || ''}
                          onChange={(e) => handleTextInputChange(item.field, e.target.value)}
                          disabled={!canManage || saving}
                          className="mt-2"
                        />
                        {checklist[item.field] && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Date saved</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Number Input */}
                    {item.inputType === 'number' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-blue-600" />
                          <label className="text-sm font-medium">{item.label}</label>
                          {item.required && <span className="text-red-500">*</span>}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <Input
                          type="number"
                          value={checklist[item.field] as string || ''}
                          onChange={(e) => handleTextInputChange(item.field, e.target.value)}
                          placeholder={item.placeholder}
                          disabled={!canManage || saving}
                          className="mt-2"
                        />
                        {checklist[item.field] && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Number saved</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fallback for items without inputType - default to boolean */}
                    {(!item.inputType || item.inputType === 'boolean') && (
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={item.id}
                          checked={Boolean(checklist[item.field]) || false}
                          onCheckedChange={(checked) => handleCheckboxChange(item.field, checked as boolean)}
                          disabled={!canManage || saving}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={item.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {item.label}
                          </label>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                        {checklist[item.field] && (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      {canManage && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={loadChecklist} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'All Changes Saved'}
          </Button>
        </div>
      )}

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">About the Bidding Checklist</h4>
              <p className="text-sm text-blue-800">
                This checklist contains essential requirements for government contracting across different jurisdictions. 
                Complete these items to improve your competitive position and ensure compliance with procurement requirements. 
                Your checklist progress is automatically saved and can be used to pre-fill future applications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
