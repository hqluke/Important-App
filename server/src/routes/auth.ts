import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

const router = Router();

router.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password required" });
        }
        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, password: hashed },
        });
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
            expiresIn: "30d",
        });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(409).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: "Signup failed" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password required" });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: "Invalid credentials" });
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
            expiresIn: "30d",
        });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch {
        res.status(500).json({ error: "Login failed" });
    }
});

export default router;
