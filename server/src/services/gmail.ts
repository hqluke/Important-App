import { google } from "googleapis";
import crypto from "crypto";
import { prisma } from "../db";

// Singleton for auth URL + code exchange only (no user context needed)
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
        scope: ["https://www.googleapis.com/auth/gmail.readonly"],
        prompt: "select_account",
        state,
    });
}

export async function exchangeCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Builds a Gmail client with the given access token and refresh token for a specific user.
 * The client is also set up to automatically refresh the access token when it expires.
 * Use for Gmail API calls to avoid race conditions and token expiration.
 * @param accessToken The access token to use
 * @param refreshToken The refresh token to use
 * @param userId The user ID to associate with the client
 * @returns A Gmail client
 */
function buildGmailClient(
    accessToken: string,
    refreshToken: string,
    userId: string,
) {
    const client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI,
    );

    client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    client.on("tokens", async (tokens) => {
        if (
            !tokens.access_token &&
            !tokens.refresh_token &&
            !tokens.expiry_date
        )
            return;

        await prisma.gmailToken
            .update({
                where: { userId },
                data: {
                    ...(tokens.access_token
                        ? { accessToken: tokens.access_token }
                        : {}),
                    ...(tokens.refresh_token
                        ? { refreshToken: tokens.refresh_token }
                        : {}),
                    ...(tokens.expiry_date
                        ? { expiresAt: new Date(tokens.expiry_date) }
                        : {}),
                },
                // errors are swallowed here, so we don't need to handle them (hopefully)
            })
            .catch(() => {});
    });

    return google.gmail({ version: "v1", auth: client });
}

/** Extract email address from a `From` header like "Name" <email>, name <email>, and bare email */
export function parseSender(from: string): string {
    const match = from.match(/<([^>]+)>/);
    return (match?.[1] ?? from).toLowerCase().trim();
}

export async function fetchEmailHeaders(
    accessToken: string,
    refreshToken: string,
    userId: string,
    afterTimestamp?: number,
) {
    const gmail = buildGmailClient(accessToken, refreshToken, userId);

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

export type ScanProgress = {
    phase: "listing" | "fetching" | "sorting";
    fetched: number;
    total: number;
};

/** Scans the user's Gmail inbox for emails within the given timestamp range
 * Returns an array of emails with their metadata.
 * Progress phases:
 *   "listing"  — collecting message IDs (total = pages discovered so far * 500)
 *   "fetching" — fetching each message's headers (total = exact ID count)
 *   "sorting"  — all done, finalizing
 * @param accessToken The access token to use
 * @param refreshToken The refresh token to use
 * @param userId The user ID to associate with the client
 * @param afterTimestamp The timestamp to start scanning from
 * @param onProgress Optional callback called after each batch of fetches
 */
export async function scanEmails(
    accessToken: string,
    refreshToken: string,
    userId: string,
    afterTimestamp: number,
    onProgress?: (p: ScanProgress) => void,
): Promise<Array<{ id: string; from: string; subject: string; date: string }>> {
    const gmail = buildGmailClient(accessToken, refreshToken, userId);
    const query = `after:${Math.floor(afterTimestamp / 1000)}`;
    const all: Array<{
        id: string;
        from: string;
        subject: string;
        date: string;
    }> = [];

    // ── Phase 1: Collect all message IDs across pages ──
    const allIds: string[] = [];
    let pageToken: string | undefined;

    do {
        const listRes = await gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults: 500,
            pageToken,
        });

        const ids = listRes.data.messages ?? [];
        if (!ids.length) break;

        for (const msg of ids) {
            if (msg.id) allIds.push(msg.id);
        }

        pageToken = listRes.data.nextPageToken ?? undefined;
        // Rough progress: estimate total based on first-page resultSizeEstimate
        const roughTotal = listRes.data.resultSizeEstimate ?? allIds.length;
        onProgress?.({ phase: "listing", fetched: allIds.length, total: Math.max(roughTotal, allIds.length) });
    } while (pageToken && allIds.length < 10000);

    // ── Phase 2: Fetch headers for every ID we found ──
    const CONCURRENCY = 10;
    for (let i = 0; i < allIds.length; i += CONCURRENCY) {
        const chunk = allIds.slice(i, i + CONCURRENCY);
        await Promise.all(
            chunk.map(async (id) => {
                const r = await gmail.users.messages.get({
                    userId: "me",
                    id,
                    format: "metadata",
                    metadataHeaders: ["Subject", "From", "Date"],
                });
                const hdrs = r.data.payload?.headers ?? [];
                const get = (name: string) =>
                    hdrs.find((h) => h.name?.toLowerCase() === name.toLowerCase())
                        ?.value ?? "";
                all.push({
                    id: r.data.id!,
                    from: get("From"),
                    subject: get("Subject"),
                    date: get("Date"),
                });
            }),
        );
        onProgress?.({ phase: "fetching", fetched: all.length, total: allIds.length });
    }

    onProgress?.({ phase: "sorting", fetched: all.length, total: all.length });

    return all;
}

export const POLL_INTERVAL = {
    free: 15 * 60 * 1000,
    premium: 2 * 60 * 1000,
};
