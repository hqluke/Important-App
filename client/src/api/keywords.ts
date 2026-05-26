import api from "./client";
import type { ImportantKeyword } from "../../types";

export async function getKeywords() {
    const { data } = await api.get<{ keywords: ImportantKeyword[] }>(
        "/keywords",
    );
    return data.keywords;
}

export async function createKeyword(keyword: string) {
    const { data } = await api.post("/keywords", { keyword });
    return data.keyword;
}

export async function deleteKeyword(id: string) {
    await api.delete(`/keywords/${id}`);
}

export async function deleteAllKeywords() {
    await api.delete("/keywords/all");
}
