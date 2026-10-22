import { Link } from "react-router-dom";
import { Route } from "lucide-react";

const PAGE_BG = "#FFFFFF";
const INK = "#0B2E22";
const GOLD = "#B3A369";
const MUTED = "#5B6660";

export default function Home() {
  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
      <div className="mx-auto px-6 py-14 max-w-5xl flex-1 flex flex-col justify-center">
        <img
          src="/unc-charlotte-logo.png?v=7"
          alt="University of North Carolina Charlotte"
          className="mb-10 h-28 sm:h-40 w-auto object-contain"
        />

        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
          School of Data Science · B.S. Data Science
        </p>
        <h1 className="text-4xl sm:text-6xl mb-4 leading-tight" style={{ fontFamily: "Georgia, serif", color: INK }}>
          Your degree,<br />mapped out.
        </h1>
        <p className="text-base sm:text-lg mb-12 max-w-xl" style={{ color: MUTED }}>
          See the semester plan ahead.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            to="/roadmap"
            className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: GOLD, color: INK }}
          >
            <Route size={18} />
            See the path ahead
          </Link>
        </div>
      </div>
    </div>
  );
}
