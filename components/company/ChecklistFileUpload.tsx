'use client'

import { useState, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  X, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Brain,
  FileCheck,
  FileX
} from 'lucide-react'

interface ChecklistFile {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_by: string
  ai_analysis: any
  ai_analysis_status: 'pending' | 'processing' | 'completed' | 'failed'
  ai_analysis_updated_at: string
  created_at: string
}

interface FileUploadProps {
  companyId: string
  checklistItemId: string
  checklistItemLabel: string
  maxFiles?: number
  maxFileSizeMB?: number
  acceptedFileTypes?: string[]
  onFileUploaded?: (file: ChecklistFile) => void
  onFileDeleted?: (fileId: string) => void
}

export default function ChecklistFileUpload({
  companyId,
  checklistItemId,
  checklistItemLabel,
  maxFiles = 5,
  maxFileSizeMB = 100,
  acceptedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ],
  onFileUploaded,
  onFileDeleted
}: FileUploadProps) {
  const [files, setFiles] = useState<ChecklistFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('text')) return '📃'
    return '📎'
  }

  const getAIStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <FileX className="h-4 w-4 text-red-500" />
      default:
        return <Brain className="h-4 w-4 text-gray-400" />
    }
  }

  const getAIStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'AI Analysis Complete'
      case 'processing':
        return 'AI Analyzing...'
      case 'failed':
        return 'AI Analysis Failed'
      default:
        return 'Pending AI Analysis'
    }
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const fileArray = Array.from(selectedFiles)
    
    // Validate files
    for (const file of fileArray) {
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the ${maxFileSizeMB}MB limit`,
          variant: 'destructive'
        })
        return
      }

      if (!acceptedFileTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an accepted file type`,
          variant: 'destructive'
        })
        return
      }
    }

    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive'
      })
      return
    }

    uploadFiles(fileArray)
  }

  const uploadFiles = async (fileArray: File[]) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadedFiles: ChecklistFile[] = []

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        const filePath = `${companyId}/${checklistItemId}/${Date.now()}-${file.name}`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bidding-checklist-files')
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Insert file record into database
        const { data: fileRecord, error: dbError } = await supabase
          .from('checklist_files')
          .insert({
            company_id: companyId,
            checklist_item_id: checklistItemId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user?.id
          })
          .select()
          .single()

        if (dbError) {
          throw new Error(`Failed to save file record: ${dbError.message}`)
        }

        uploadedFiles.push(fileRecord)
        setUploadProgress(((i + 1) / fileArray.length) * 100)
      }

      setFiles(prev => [...prev, ...uploadedFiles])
      
      toast({
        title: 'Files uploaded successfully',
        description: `${fileArray.length} file(s) uploaded and queued for AI analysis`
      })

      // Notify parent component
      uploadedFiles.forEach(file => onFileUploaded?.(file))

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteFile = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId)
      if (!file) return

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('bidding-checklist-files')
        .remove([file.file_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('checklist_files')
        .delete()
        .eq('id', fileId)

      if (dbError) {
        throw new Error(`Failed to delete file record: ${dbError.message}`)
      }

      setFiles(prev => prev.filter(f => f.id !== fileId))
      onFileDeleted?.(fileId)

      toast({
        title: 'File deleted',
        description: `${file.file_name} has been removed`
      })

    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive'
      })
    }
  }

  const downloadFile = async (file: ChecklistFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('bidding-checklist-files')
        .download(file.file_path)

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`)
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = file.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive'
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files for {checklistItemLabel}
          </CardTitle>
          <CardDescription>
            Upload supporting documents for this checklist item. Files will be automatically analyzed by AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedFileTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploading files...</p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}% complete</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {maxFiles} files, {maxFileSizeMB}MB each
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* File Type Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Accepted file types:</p>
            <div className="flex flex-wrap gap-1">
              {acceptedFileTypes.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type.split('/')[1].toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Files ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          {getAIStatusIcon(file.ai_analysis_status)}
                          <span>{getAIStatusText(file.ai_analysis_status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {files.some(f => f.ai_analysis_status === 'completed' && f.ai_analysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
            <CardDescription>
              AI analysis of your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files
                .filter(f => f.ai_analysis_status === 'completed' && f.ai_analysis)
                .map((file) => (
                  <div key={file.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{file.file_name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {JSON.stringify(file.ai_analysis, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
