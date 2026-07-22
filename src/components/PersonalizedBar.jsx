import { Link } from "react-router-dom";
import { Sparkles, MessageCircle, Route, ClipboardList } from "lucide-react";

const INK = "#0B2E22";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";

export default function PersonalizedBar({ onOpenChat, onViewRoadmap }) {
  return (
    <div
      className="rounded-2xl px-5 py-4 mb-8 flex flex-wrap items-center justify-between gap-4"
      style={{ background: SURFACE, border: "1px solid #E4E1D4" }}
    >
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={14} color={GREEN} />
          <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: GREEN }}>
            Personalized recommendations
          </p>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold" style={{ color: INK, fontFamily: "Georgia, serif" }}>
          Your courses and career paths
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenChat}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: INK, color: "#FFFFFF" }}
        >
          <MessageCircle size={16} />
          Open advisor chat
        </button>
        <button
          type="button"
          onClick={onViewRoadmap}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors hover:bg-gray-50"
          style={{ background: SURFACE, color: INK, border: "1px solid #DCDACD" }}
        >
          <Route size={16} color={GREEN} />
          View roadmap
        </button>
        <Link
          to="/degree-works"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: GREEN, color: "#FFFFFF" }}
        >
          <ClipboardList size={14} />
          Degree Works
        </Link>
      </div>
    </div>
  );
}
