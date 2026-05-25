import api from "./client";

export async function getGmailAuthUrl() {
    const { data } = await api.get<{ url: string }>("/gmail/auth");
    return data.url;
}

export async function disconnectGmail() {
    await api.post("/gmail/disconnect");
}

export async function getGmailStatus() {
    const { data } = await api.get<{
        connected: boolean;
        expiresAt: string | null;
    }>("/gmail/status");
    return data;
}
