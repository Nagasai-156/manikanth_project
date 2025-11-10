// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// App Configuration
export const APP_NAME = 'InterviewExp'
export const APP_DESCRIPTION = 'Share and explore interview experiences from your college'

// Feature Flags
export const FEATURES = {
  COMMENTS: true,
  CHAT: true,
  ADMIN_PANEL: true,
  ANALYTICS: true,
}

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// File Upload (if needed in future)
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
