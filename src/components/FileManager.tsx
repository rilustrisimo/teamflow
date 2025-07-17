import React, { useState, useEffect } from 'react'
import { 
  Files, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye,
  HardDrive,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Image,
  File
} from 'lucide-react'
import { FileStorageService, type FileAttachment } from '../lib/fileStorage'
import { useAppContext } from '../context/AppContext'

const FileManager: React.FC = () => {
  const { currentUser } = useAppContext()
  const [files, setFiles] = useState<FileAttachment[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stats, setStats] = useState({
    total_files: 0,
    total_size: 0,
    by_type: {} as Record<string, number>
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadFiles()
    loadStats()
  }, [])

  useEffect(() => {
    filterFiles()
  }, [files, searchTerm, typeFilter])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await FileStorageService.getUserFiles(currentUser?.id || '')
      
      if (error) {
        setError('Failed to load files')
        return
      }

      setFiles(data)
    } catch (error) {
      console.error('Error loading files:', error)
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { total_files, total_size, by_type, error } = await FileStorageService.getFileStats(
        currentUser?.role === 'admin' ? undefined : currentUser?.id
      )
      
      if (error) {
        console.error('Error loading stats:', error)
        return
      }

      setStats({ total_files, total_size, by_type })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const filterFiles = () => {
    let filtered = files

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.mime_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(file => {
        switch (typeFilter) {
          case 'images':
            return file.mime_type.startsWith('image/')
          case 'documents':
            return file.mime_type === 'application/pdf' || 
                   file.mime_type.includes('word') || 
                   file.mime_type.includes('document') ||
                   file.mime_type.includes('spreadsheet') ||
                   file.mime_type.includes('excel')
          case 'text':
            return file.mime_type.startsWith('text/')
          default:
            return true
        }
      })
    }

    setFilteredFiles(filtered)
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

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await FileStorageService.deleteFile(fileId)
      
      if (error) {
        setError('Failed to delete file')
        return
      }

      setFiles(prev => prev.filter(f => f.id !== fileId))
      setSuccess('File deleted successfully')
      
      // Reload stats
      loadStats()
    } catch (error) {
      console.error('Delete error:', error)
      setError('Failed to delete file')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-4 h-4 text-blue-600" />
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="w-4 h-4 text-green-600" />
    return <File className="w-4 h-4 text-gray-400" />
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Access denied. Please log in.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">File Manager</h2>
          <p className="text-gray-400">Manage and organize your files</p>
        </div>
        <div className="flex items-center space-x-2">
          <Files className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-gray-300">
            {filteredFiles.length} of {files.length} files
          </span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={clearMessages} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
          <button onClick={clearMessages} className="text-green-400 hover:text-green-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Files</p>
              <p className="text-2xl font-bold text-white">{stats.total_files}</p>
            </div>
            <Files className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Size</p>
              <p className="text-2xl font-bold text-white">
                {FileStorageService.formatFileSize(stats.total_size)}
              </p>
            </div>
            <HardDrive className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Images</p>
              <p className="text-2xl font-bold text-white">
                {Object.entries(stats.by_type)
                  .filter(([type]) => type.startsWith('image/'))
                  .reduce((sum, [, count]) => sum + count, 0)}
              </p>
            </div>
            <Image className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Documents</p>
              <p className="text-2xl font-bold text-white">
                {Object.entries(stats.by_type)
                  .filter(([type]) => type === 'application/pdf' || type.includes('document'))
                  .reduce((sum, [, count]) => sum + count, 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="images">Images</option>
              <option value="documents">Documents</option>
              <option value="text">Text Files</option>
            </select>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Files className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No files found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="text-left p-4 text-gray-200">File</th>
                  <th className="text-left p-4 text-gray-200">Type</th>
                  <th className="text-left p-4 text-gray-200">Size</th>
                  <th className="text-left p-4 text-gray-200">Uploaded</th>
                  <th className="text-left p-4 text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, index) => (
                  <tr key={file.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.mime_type)}
                        <div>
                          <div className="font-medium text-white">{file.original_name}</div>
                          <div className="text-sm text-gray-400">{file.filename}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {file.mime_type}
                    </td>
                    <td className="p-4 text-gray-300">
                      {FileStorageService.formatFileSize(file.file_size)}
                    </td>
                    <td className="p-4 text-gray-300">
                      {new Date(file.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileManager
