import { supabase } from './supabase'

export interface FileUploadOptions {
  bucket: string
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
}

export interface FileAttachment {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  bucket_name: string
  file_path: string
  uploaded_by: string
  project_id?: string
  task_id?: string
  created_at: string
  updated_at: string
  public_url?: string
}

export class FileStorageService {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  /**
   * Upload a file to Supabase Storage
   */
  static async uploadFile(
    file: File,
    options: FileUploadOptions,
    userId: string
  ): Promise<{ data: FileAttachment | null; error: any }> {
    try {
      // Validate file size
      const maxSize = options.maxSize || this.DEFAULT_MAX_SIZE
      if (file.size > maxSize) {
        return {
          data: null,
          error: new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`)
        }
      }

      // Validate file type
      const allowedTypes = options.allowedTypes || this.DEFAULT_ALLOWED_TYPES
      if (!allowedTypes.includes(file.type)) {
        return {
          data: null,
          error: new Error(`File type ${file.type} is not allowed`)
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const folder = options.folder || userId
      const filePath = `${folder}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        return { data: null, error: uploadError }
      }

      // Save file metadata to database
      const { data: attachmentData, error: dbError } = await supabase
        .from('file_attachments')
        .insert({
          filename: fileName,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          bucket_name: options.bucket,
          file_path: filePath,
          uploaded_by: userId
        })
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(options.bucket).remove([filePath])
        return { data: null, error: dbError }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath)

      const fileAttachment: FileAttachment = {
        ...attachmentData,
        public_url: urlData.publicUrl
      }

      return { data: fileAttachment, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Delete a file from storage and database
   */
  static async deleteFile(fileId: string): Promise<{ error: any }> {
    try {
      // Get file info from database
      const { data: fileData, error: fetchError } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError) {
        return { error: fetchError }
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(fileData.bucket_name)
        .remove([fileData.file_path])

      if (storageError) {
        return { error: storageError }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', fileId)

      return { error: dbError }
    } catch (error) {
      return { error }
    }
  }

  /**
   * Get file download URL
   */
  static async getFileUrl(bucketName: string, filePath: string): Promise<{ url: string | null; error: any }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error) {
        return { url: null, error }
      }

      return { url: data.signedUrl, error: null }
    } catch (error) {
      return { url: null, error }
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(bucketName: string, filePath: string): string {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * List files for a project
   */
  static async getProjectFiles(projectId: string): Promise<{ data: FileAttachment[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select(`
          *,
          profiles:uploaded_by (
            full_name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error }
      }

      // Add public URLs
      const filesWithUrls = data.map(file => ({
        ...file,
        public_url: this.getPublicUrl(file.bucket_name, file.file_path)
      }))

      return { data: filesWithUrls, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  /**
   * List files for a task
   */
  static async getTaskFiles(taskId: string): Promise<{ data: FileAttachment[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select(`
          *,
          profiles:uploaded_by (
            full_name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error }
      }

      // Add public URLs
      const filesWithUrls = data.map(file => ({
        ...file,
        public_url: this.getPublicUrl(file.bucket_name, file.file_path)
      }))

      return { data: filesWithUrls, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  /**
   * List all files for a user
   */
  static async getUserFiles(userId: string): Promise<{ data: FileAttachment[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error }
      }

      // Add public URLs
      const filesWithUrls = data.map(file => ({
        ...file,
        public_url: this.getPublicUrl(file.bucket_name, file.file_path)
      }))

      return { data: filesWithUrls, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  /**
   * Update file metadata
   */
  static async updateFileMetadata(
    fileId: string,
    updates: { project_id?: string; task_id?: string }
  ): Promise<{ data: FileAttachment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get file statistics
   */
  static async getFileStats(userId?: string): Promise<{ 
    total_files: number;
    total_size: number;
    by_type: Record<string, number>;
    error: any 
  }> {
    try {
      let query = supabase
        .from('file_attachments')
        .select('file_size, mime_type')

      if (userId) {
        query = query.eq('uploaded_by', userId)
      }

      const { data, error } = await query

      if (error) {
        return { total_files: 0, total_size: 0, by_type: {}, error }
      }

      const stats = data.reduce((acc, file) => {
        acc.total_files++
        acc.total_size += file.file_size
        acc.by_type[file.mime_type] = (acc.by_type[file.mime_type] || 0) + 1
        return acc
      }, { total_files: 0, total_size: 0, by_type: {} as Record<string, number> })

      return { ...stats, error: null }
    } catch (error) {
      return { total_files: 0, total_size: 0, by_type: {}, error }
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file icon based on MIME type
   */
  static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.startsWith('text/')) return '📝'
    return '📎'
  }
}
