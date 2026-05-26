import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../db";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
    const senders = await prisma.importantSender.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
    });
    res.json({ senders });
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
    try {
        const { email, label } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });
        const sender = await prisma.importantSender.create({
            data: { userId: req.userId!, email, label },
        });
        res.json({ sender });
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(409).json({ error: "Sender already exists" });
        }
        res.status(500).json({ error: "Failed to create sender" });
    }
});

router.delete("/all", requireAuth, async (req: AuthRequest, res) => {
    await prisma.importantSender.deleteMany({ where: { userId: req.userId! } });
    res.json({ ok: true });
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
        await prisma.importantSender.deleteMany({
            where: { id: req.params.id as string, userId: req.userId! },
        });
        res.json({ ok: true });
    } catch {
        res.status(500).json({ error: "Failed to delete sender" });
    }
});

export default router;
