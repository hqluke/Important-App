import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../db";
import { scanEmails, parseSender } from "../services/gmail";
import type { ScanProgress } from "../services/gmail";

const WINDOW_MS: Record<string, number> = {
    "1m": 30 * 24 * 60 * 60 * 1000,
    "3m": 90 * 24 * 60 * 60 * 1000,
    "6m": 180 * 24 * 60 * 60 * 1000,
    "12m": 365 * 24 * 60 * 60 * 1000,
};

function sse(res: import("express").Response, event: string, data: unknown) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

const router = Router();

// Run a scan: fetch emails, aggregate senders, save to ScannedSender table
// Returns an SSE stream with status and complete events
router.post("/", requireAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.userId!;
        const window = (req.body.window as string) ?? "3m";

        if (!["1m", "3m", "6m", "12m"].includes(window)) {
            return res.status(400).json({
                error: 'Invalid window. Use "1m", "3m", "6m", or "12m"',
            });
        }

        const token = await prisma.gmailToken.findUnique({ where: { userId } });
        if (!token) {
            return res.status(404).json({ error: "Gmail not connected" });
        }

        //HACK: Comment below to scan gmail as much as you like
        if (
            token.lastScanAt &&
            Date.now() - token.lastScanAt.getTime() < 24 * 60 * 60 * 1000
        ) {
            const existing = await prisma.scannedSender.findMany({
                where: { userId },
                orderBy: { count: "desc" },
            });
            if (existing.length > 0) {
                return res.json({ senders: existing, cached: true });
            }
            return res
                .status(429)
                .json({ error: "Can only scan once per 24 hours" });
        }

        // Set SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const afterTimestamp = Date.now() - WINDOW_MS[window];
        const emails = await scanEmails(
            token.accessToken,
            token.refreshToken,
            userId,
            afterTimestamp,
            (progress: ScanProgress) => {
                sse(res, "status", progress);
            },
        );

        sse(res, "status", {
            phase: "sorting",
            fetched: emails.length,
            total: emails.length,
        });

        // Count emails per sender
        const senderCounts = new Map<string, number>();
        for (const email of emails) {
            const sender = parseSender(email.from);
            senderCounts.set(sender, (senderCounts.get(sender) ?? 0) + 1);
        }

        const senders = [...senderCounts.entries()]
            .filter(([, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 300)
            .map(([email, count]) => ({ email, count }));

        await prisma.scannedSender.deleteMany({ where: { userId } });
        await prisma.scannedSender.createMany({
            data: senders.map((s) => ({
                userId,
                email: s.email,
                count: s.count,
            })),
        });

        await prisma.gmailToken.update({
            where: { userId },
            data: { lastScanAt: new Date() },
        });

        sse(res, "complete", { senders });
        res.end();
    } catch (err) {
        console.error("Scan failed:", err);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Scan failed" });
        }
        sse(res, "error", { error: "Scan failed" });
        res.end();
    }
});

// Clear scanned results (useful for testing / re-running)
router.delete("/reset", requireAuth, async (req: AuthRequest, res) => {
    await prisma.scannedSender.deleteMany({ where: { userId: req.userId! } });
    await prisma.gmailToken.update({
        where: { userId: req.userId! },
        data: { lastScanAt: null },
    });
    res.json({ ok: true });
});

// Check whether the user can scan (survives page refresh / disconnect)
router.get("/status", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const token = await prisma.gmailToken.findUnique({
        where: { userId },
        select: { lastScanAt: true },
    });
    const lastScanAt = token?.lastScanAt ?? null;
    const canScan =
        !lastScanAt || Date.now() - lastScanAt.getTime() >= 24 * 60 * 60 * 1000;
    res.json({ canScan, lastScanAt });
});

// Retrieve the last scan results (survives page refresh / disconnect)
router.get("/results", requireAuth, async (req: AuthRequest, res) => {
    const userSenders = await prisma.scannedSender.findMany({
        where: { userId: req.userId! },
        orderBy: { count: "desc" },
    });
    const token = await prisma.gmailToken.findUnique({
        where: { userId: req.userId! },
        select: { lastScanAt: true },
    });
    res.json({
        senders: userSenders,
        lastScanAt: token?.lastScanAt ?? null,
    });
});

// Confirm and save selected senders as ImportantSenders
router.post("/save", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const selected: Array<{
        email: string;
        label?: string;
        category?: string;
    }> = req.body.senders;

    if (!Array.isArray(selected) || selected.length === 0) {
        return res.status(400).json({ error: "No senders provided" });
    }

    const saved: Array<{
        email: string;
        label: string | null;
        category: string | null;
    }> = [];

    for (const s of selected) {
        const upserted = await prisma.importantSender.upsert({
            where: { userId_email: { userId, email: s.email } },
            update: { label: s.label ?? null, category: s.category ?? null },
            create: {
                userId,
                email: s.email,
                label: s.label ?? null,
                category: s.category ?? null,
            },
        });
        saved.push({
            email: upserted.email,
            label: upserted.label,
            category: upserted.category,
        });
    }

    // Clean up scanned results now that they're saved
    await prisma.scannedSender.deleteMany({ where: { userId } });

    res.json({ senders: saved });
});

export default router;
