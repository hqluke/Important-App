export interface User {
  id: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ImportantSender {
  id: string
  userId: string
  email: string
  label: string | null
  createdAt: string
}

export interface ImportantKeyword {
  id: string
  userId: string
  keyword: string
  createdAt: string
}

export interface SavedNotification {
  id: string
  userId: string
  subject: string
  sender: string
  date: string
  gmailId: string
  createdAt: string
  expiresAt: string
}
