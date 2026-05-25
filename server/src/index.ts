import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes from './routes/auth'
import gmailRoutes from './routes/gmail'
import senderRoutes from './routes/senders'
import keywordRoutes from './routes/keywords'
import notificationRoutes from './routes/notifications'
import { exchangeCode, consumeState } from './services/gmail'
import { prisma } from './db'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/gmail', gmailRoutes)
app.use('/api/senders', senderRoutes)
app.use('/api/keywords', keywordRoutes)
app.use('/api/notifications', notificationRoutes)

// Gmail OAuth callback at the exact URI registered with Google Cloud Console
app.get('/api/auth/gmail/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code || typeof code !== 'string') {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/gmail/callback?error=missing_code`)
    }

    const userId = consumeState(state as string)
    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/gmail/callback?error=invalid_state`)
    }

    const tokens = await exchangeCode(code)
    const refreshToken = tokens.refresh_token ??
      (await prisma.gmailToken.findUnique({ where: { userId }, select: { refreshToken: true } }))?.refreshToken

    if (!refreshToken) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/gmail/callback?error=no_refresh_token`)
    }

    await prisma.gmailToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token!,
        refreshToken,
        expiresAt: new Date(tokens.expiry_date!),
      },
      create: {
        userId,
        accessToken: tokens.access_token!,
        refreshToken,
        expiresAt: new Date(tokens.expiry_date!),
      },
    })

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/gmail/callback?success=true`)
  } catch {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/gmail/callback?error=exchange_failed`)
  }
})

app.listen(3001, () => console.log('Server running on 3001'))
