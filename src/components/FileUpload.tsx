import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { FileStorageService, type FileAttachment, type FileUploadOptions } from '../lib/fileStorage'
import { useAppContext } from '../context/AppContext'

interface FileUploadProps {
  bucket: string
  folder?: string
  maxSize?: number
  allowedTypes?: string[]
  projectId?: string
  taskId?: string
  onUploadComplete?: (file: FileAttachment) => void
  onDeleteComplete?: (fileId: string) => void
  showFileList?: boolean
  multiple?: boolean
}

const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  folder,
  maxSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes,
  projectId,
  taskId,
  onUploadComplete,
  onDeleteComplete,
  showFileList = true,
  multiple = true
}) => {
  const { currentUser } = useAppContext()
  const [files, setFiles] = useState<FileAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing files
  React.useEffect(() => {
    if (showFileList) {
      loadFiles()
    }
  }, [projectId, taskId, showFileList])

  const loadFiles = async () => {
    try {
      let result
      if (projectId) {
        result = await FileStorageService.getProjectFiles(projectId)
      } else if (taskId) {
        result = await FileStorageService.getTaskFiles(taskId)
      } else {
        return
      }

      if (result.error) {
        setError('Failed to load files')
        return
      }

      setFiles(result.data)
    } catch (error) {
      console.error('Error loading files:', error)
      setError('Failed to load files')
    }
  }

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    if (!currentUser) return

    const fileArray = Array.from(selectedFiles)
    uploadFiles(fileArray)
  }, [currentUser])

  const uploadFiles = async (fileArray: File[]) => {
    if (!currentUser) return

    setUploading(true)
    setError('')
    setSuccess('')

    const options: FileUploadOptions = {
      bucket,
      folder,
      maxSize,
      allowedTypes
    }

    try {
      for (const file of fileArray) {
        const { data, error } = await FileStorageService.uploadFile(
          file,
          options,
          currentUser.id
        )

        if (error) {
          setError(`Failed to upload ${file.name}: ${error.message}`)
          continue
        }

        if (data) {
          // Update file metadata if needed
          if (projectId || taskId) {
            await FileStorageService.updateFileMetadata(data.id, {
              project_id: projectId,
              task_id: taskId
            })
          }

          // Update local state
          setFiles(prev => [data, ...prev])
          
          // Call callback
          if (onUploadComplete) {
            onUploadComplete(data)
          }
        }
      }

      setSuccess(`Successfully uploaded ${fileArray.length} file(s)`)
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const { error } = await FileStorageService.deleteFile(fileId)
      
      if (error) {
        setError('Failed to delete file')
        return
      }

      // Update local state
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      // Call callback
      if (onDeleteComplete) {
        onDeleteComplete(fileId)
      }

      setSuccess('File deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      setError('Failed to delete file')
    }
  }

  const handleDownload = async (file: FileAttachment) => {
    try {
      const { url, error } = await FileStorageService.getFileUrl(
        file.bucket_name,
        file.file_path
      )

      if (error || !url) {
        setError('Failed to get download URL')
        return
      }

      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = file.original_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      setError('Failed to download file')
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Uploading files...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Drag and drop files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-500 hover:text-blue-600 underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Max size: {FileStorageService.formatFileSize(maxSize)}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes?.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={clearMessages} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
            <button onClick={clearMessages} className="text-green-400 hover:text-green-300">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      {showFileList && files.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Uploaded Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.mime_type)}
                  <div>
                    <p className="text-sm font-medium text-white">
                      {file.original_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {FileStorageService.formatFileSize(file.file_size)} • {' '}
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.public_url && (
                    <button
                      onClick={() => window.open(file.public_url, '_blank')}
                      className="text-blue-400 hover:text-blue-300"
                      title="View file"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(file)}
                    className="text-green-400 hover:text-green-300"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload
