import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getKeywords, createKeyword, deleteKeyword } from "../api/keywords";
import ConfirmModal from "./ConfirmModal";
import type { ImportantKeyword } from "../../types";
import { useAuth } from "../context/AuthContext";

const KeywordsSetup = () => {
    const { updateKeywordsSetup } = useAuth();
    const navigate = useNavigate();
    const [keywords, setKeywords] = useState<ImportantKeyword[]>([]);
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getKeywords()
            .then(setKeywords)
            .catch(() => {});
    }, []);

    const addKeyword = async () => {
        const word = input.trim().toLowerCase();
        if (!word) return;
        if (/\s/.test(word)) {
            setError("Only single words allowed (no spaces).");
            return;
        }
        if (keywords.some((k) => k.keyword === word)) {
            setError("Keyword already added.");
            return;
        }
        setError("");
        try {
            const kw = await createKeyword(word);
            setKeywords((prev) => [kw, ...prev]);
            setInput("");
            inputRef.current?.focus();
        } catch (err: any) {
            if (err.response?.status === 409) {
                setError("Keyword already exists.");
            } else {
                setError("Failed to save keyword.");
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addKeyword();
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await deleteKeyword(id);
            setKeywords((prev) => prev.filter((k) => k.id !== id));
        } catch {
            setError("Failed to remove keyword.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-2 text-emphasis">Keywords</h2>
            <p className="text-muted text-sm mb-4">
                Add keywords that will trigger notifications when they appear in
                matching email subjects.
            </p>

            {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="flex gap-x-2 mb-4">
                <input
                    ref={inputRef}
                    type="text"
                    maxLength={24}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a keyword and press Enter"
                    className="flex-1 border border-border bg-surface-card text-emphasis placeholder:text-subtle p-2 rounded"
                    autoFocus
                />
                <button
                    onClick={addKeyword}
                    disabled={!input.trim()}
                    className="bg-blue-500 text-white px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    Add
                </button>
            </div>

            {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {keywords.map((kw) => (
                        <div
                            key={kw.id}
                            className="flex items-center gap-x-2 bg-surface-card text-emphasis px-3 py-1.5 rounded-full text-sm"
                        >
                            <span>{kw.keyword}</span>
                            <button
                                onClick={() => handleRemove(kw.id)}
                                className="text-muted hover:text-red-400 transition-colors leading-none text-lg"
                                title="Remove keyword"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={() => setShowConfirm(true)}
                className="bg-blue-500 text-white p-2 px-6 rounded-md hover:bg-blue-600 transition-colors"
            >
                Save Keywords
            </button>

            {showConfirm && (
                <ConfirmModal
                    title="Confirm Keywords"
                    confirmLabel="Confirm"
                    cancelLabel="Cancel"
                    onConfirm={() => {
                        updateKeywordsSetup(true);
                        navigate("/");
                    }}
                    onCancel={() => setShowConfirm(false)}
                >
                    {keywords.length === 0 && (
                        <p className="text-muted">No keywords added.</p>
                    )}
                    {keywords.map((kw) => (
                        <div key={kw.id} className="py-0.5">
                            {kw.keyword}
                        </div>
                    ))}
                </ConfirmModal>
            )}
        </div>
    );
};

export default KeywordsSetup;
