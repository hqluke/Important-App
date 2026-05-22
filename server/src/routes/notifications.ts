import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../db'

const router = Router()

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const notifications = await prisma.savedNotification.findMany({
    where: { userId: req.userId, expiresAt: { gt: new Date() } },
    orderBy: { date: 'desc' },
  })
  res.json({ notifications })
})

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { subject, sender, date, gmailId } = req.body
    if (!subject || !sender || !gmailId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const notification = await prisma.savedNotification.create({
      data: {
        userId: req.userId!,
        subject,
        sender,
        date: new Date(date),
        gmailId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    res.json({ notification })
  } catch {
    res.status(500).json({ error: 'Failed to save notification' })
  }
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await prisma.savedNotification.deleteMany({
      where: { id: req.params.id as string, userId: req.userId! },
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

export default router
