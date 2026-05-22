import api from './client'
import type { SavedNotification } from '../../types'

export async function getNotifications() {
  const { data } = await api.get<{ notifications: SavedNotification[] }>('/notifications')
  return data.notifications
}

export async function saveNotification(notification: {
  subject: string
  sender: string
  date: string
  gmailId: string
}) {
  const { data } = await api.post('/notifications', notification)
  return data.notification
}

export async function deleteNotification(id: string) {
  await api.delete(`/notifications/${id}`)
}
