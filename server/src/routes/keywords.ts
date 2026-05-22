import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../db'

const router = Router()

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const keywords = await prisma.importantKeyword.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ keywords })
})

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { keyword } = req.body
    if (!keyword) return res.status(400).json({ error: 'Keyword required' })
    const kw = await prisma.importantKeyword.create({
      data: { userId: req.userId!, keyword: keyword.toLowerCase() },
    })
    res.json({ keyword: kw })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Keyword already exists' })
    }
    res.status(500).json({ error: 'Failed to create keyword' })
  }
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await prisma.importantKeyword.deleteMany({
      where: { id: req.params.id as string, userId: req.userId! },
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete keyword' })
  }
})

export default router
