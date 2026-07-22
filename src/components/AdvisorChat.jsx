import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { STEP_LABELS } from "../data/curriculum";

const INK = "#0B2E22";
const GOLD = "#B3A369";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";

const WELCOME = "Hi! I'm your DS Pathway advisor assistant. Ask me about courses, electives, your roadmap, or career paths in the data science major.";

function serializeSelections(selections) {
  const out = {};
  for (const [key, set] of Object.entries(selections)) {
    if (set instanceof Set) out[key] = [...set];
    else if (Array.isArray(set)) out[key] = set;
  }
  return out;
}

export default function AdvisorChat({ isOpen, onOpenChange, context, showFab = true }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          context: {
            step: context.step,
            stepLabel: STEP_LABELS[context.step],
            selections: serializeSelections(context.selections),
            note: context.note,
            careerTarget: context.careerTarget,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err.message.includes("API key")
            ? "The advisor chat isn't configured yet. Add your GEMINI_API_KEY to a .env file and restart the server."
            : "Sorry, I couldn't respond right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!isOpen && showFab && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-semibold transition-transform hover:scale-105"
          style={{ background: GOLD, color: INK }}
          aria-label="Open advisor chat"
        >
          <MessageCircle size={18} />
          Ask advisor
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col w-[min(100vw-2rem,380px)] h-[min(80vh,520px)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: SURFACE, border: `1px solid ${GOLD}` }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ background: INK }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>Advisor assistant</p>
              <p className="text-[10px]" style={{ color: "#BFD9CB" }}>Powered by Gemini · Planning tool only</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-full hover:bg-white/10"
              aria-label="Close chat"
            >
              <X size={18} color="#FFFFFF" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "#F7F8F4" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: msg.role === "user" ? GREEN : SURFACE,
                    color: msg.role === "user" ? "#FFFFFF" : INK,
                    border: msg.role === "user" ? "none" : "1px solid #E4E1D4",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3 py-2 flex items-center gap-2 text-sm" style={{ background: SURFACE, border: "1px solid #E4E1D4", color: MUTED }}>
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="px-4 py-1 text-[10px]" style={{ color: "#C47A20", background: "#FFF8E8" }}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 p-3" style={{ borderTop: "1px solid #E4E1D4" }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about courses, electives, careers..."
              disabled={loading}
              className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
              style={{ background: "#F5F6F1", border: "1px solid #D9D6C9", color: INK }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 disabled:opacity-40"
              style={{ background: GOLD, color: INK }}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
