import api from "./client";
import type { ImportantSender } from "../../types";

export async function getSenders() {
    const { data } = await api.get<{ senders: ImportantSender[] }>("/senders");
    return data.senders;
}

export async function createSender(email: string, label?: string) {
    const { data } = await api.post("/senders", { email, label });
    return data.sender;
}

export async function deleteSender(id: string) {
    await api.delete(`/senders/${id}`);
}

export async function deleteAllSenders() {
    await api.delete("/senders/all");
}
