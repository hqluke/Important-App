import api from "./client";

export const getScanResults = async () => {
    const { data } = await api.get("/scan/results");
    return data;
};

export const saveSenders = async (
    senders: Array<{ email: string; label?: string; category?: string }>,
) => {
    const { data } = await api.post("/scan/save", { senders });
    return data;
};

export type ScanStatus = {
    phase: "listing" | "fetching" | "sorting";
    fetched: number;
    total: number;
};

export type ScanResult = {
    senders: Array<{ email: string; count: number }>;
    cached?: boolean;
};

export type StreamCallbacks = {
    onStatus: (status: ScanStatus) => void;
    onComplete: (data: ScanResult) => void;
    onError: (error: string) => void;
};

export function streamScan(
    window: string,
    { onStatus, onComplete, onError }: StreamCallbacks,
): AbortController {
    const abort = new AbortController();

    const token = localStorage.getItem("token");

    fetch("/api/scan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ window }),
        signal: abort.signal,
    })
        .then(async (response) => {
            if (!response.ok) {
                const body = await response.json().catch(() => null);
                if (response.status === 404) {
                    onError("Gmail not connected.");
                } else if (response.status === 429) {
                    onError("Can only scan once per 24 hours.");
                } else {
                    onError(body?.error ?? "Failed to scan emails.");
                }
                return;
            }

            const contentType = response.headers.get("content-type") ?? "";
            if (!contentType.includes("text/event-stream")) {
                const body = await response.json();
                onComplete(body);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                onError("Stream not supported.");
                return;
            }

            const decoder = new TextDecoder();
            let buffer = "";
            let currentEvent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (line.startsWith("event: ")) {
                        currentEvent = line.slice(7).trim();
                    } else if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (currentEvent === "status") {
                            onStatus(JSON.parse(data));
                        } else if (currentEvent === "complete") {
                            onComplete(JSON.parse(data));
                        } else if (currentEvent === "error") {
                            onError(JSON.parse(data).error ?? "Scan failed");
                        }
                        currentEvent = "";
                    }
                }
            }
        })
        .catch((err) => {
            if (err.name !== "AbortError") {
                onError("Failed to scan emails.");
            }
        });

    return abort;
}
