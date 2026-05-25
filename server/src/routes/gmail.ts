import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getAuthUrl, createState } from "../services/gmail";
import { prisma } from "../db";

const router = Router();

router.get("/auth", requireAuth, (req: AuthRequest, res) => {
    const state = createState(req.userId!);
    const url = getAuthUrl(state);
    res.json({ url });
});

router.get("/status", requireAuth, async (req: AuthRequest, res) => {
    const token = await prisma.gmailToken.findUnique({
        where: { userId: req.userId! },
        select: { id: true, expiresAt: true },
    });
    res.json({ connected: !!token, expiresAt: token?.expiresAt ?? null });
});

router.post("/disconnect", requireAuth, async (req: AuthRequest, res) => {
    const token = await prisma.gmailToken.findUnique({
        where: { userId: req.userId! },
    });

    if (token?.refreshToken) {
        try {
            await fetch("https://oauth2.googleapis.com/revoke", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ token: token.refreshToken }),
            });
        } catch {
            // just swallow the error here and delete the token from the DB
        }
    }

    await prisma.gmailToken.deleteMany({ where: { userId: req.userId! } });
    res.json({ ok: true });
});

router.get("/emails", requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await prisma.gmailToken.findUnique({
            where: { userId: req.userId! },
        });
        if (!token) {
            return res.status(404).json({ error: "Gmail not connected" });
        }
        const { fetchEmailHeaders } = await import("../services/gmail");
        const emails = await fetchEmailHeaders(
            token.accessToken,
            token.refreshToken,
            token.userId,
        );
        res.json({ emails });
    } catch {
        res.status(500).json({ error: "Failed to fetch emails" });
    }
});

export default router;
