import { google } from "googleapis";
import crypto from "crypto";

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
);

// In-memory state → userId mapping (use Redis in production)
const stateStore = new Map<string, { userId: string; expiresAt: number }>();

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cleanupExpired() {
    const now = Date.now();
    for (const [key, val] of stateStore) {
        if (val.expiresAt < now) stateStore.delete(key);
    }
}

export function createState(userId: string): string {
    cleanupExpired();
    const state = crypto.randomBytes(32).toString("hex");
    stateStore.set(state, { userId, expiresAt: Date.now() + STATE_TTL_MS });
    return state;
}

export function consumeState(state: string): string | null {
    const entry = stateStore.get(state);
    if (!entry || entry.expiresAt < Date.now()) {
        stateStore.delete(state);
        return null;
    }
    stateStore.delete(state);
    return entry.userId;
}

export function getAuthUrl(state?: string) {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/gmail.metadata"],
        prompt: "select_account",
        state,
    });
}

export async function exchangeCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

//TODO: Set it up so user can get past emails from 1/3/6 months ago
export async function fetchEmailHeaders(
    accessToken: string,
    refreshToken: string,
    afterTimestamp?: number,
) {
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const query = afterTimestamp
        ? `after:${Math.floor(afterTimestamp / 1000)}`
        : "";

    const listRes = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 50,
    });

    const messages = listRes.data.messages ?? [];

    const headers = await Promise.all(
        messages.map((msg) =>
            gmail.users.messages.get({
                userId: "me",
                id: msg.id!,
                format: "metadata",
                metadataHeaders: ["Subject", "From", "Date"],
            }),
        ),
    );

    return headers.map((res) => {
        const hdrs = res.data.payload?.headers ?? [];
        const get = (name: string) =>
            hdrs.find((h) => h.name?.toLowerCase() === name.toLowerCase())
                ?.value ?? "";
        return {
            id: res.data.id,
            subject: get("Subject"),
            from: get("From"),
            date: get("Date"),
        };
    });
}

export const POLL_INTERVAL = {
    free: 15 * 60 * 1000,
    premium: 2 * 60 * 1000,
};
