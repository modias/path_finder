import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import CatalogBrowser from "./CatalogBrowser";

const PAGE_BG = "#00543C";
const GOLD = "#B3A369";
const ON_DARK_MUTED = "#BFD9CB";

/** Standalone course catalog page (kept for direct links). */
export default function CourseCatalog() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen" style={{ background: PAGE_BG }}>
      <div className="mx-auto px-6 py-14 max-w-7xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img
              src="/unc-charlotte-logo.png?v=5"
              alt="University of North Carolina Charlotte"
              className="h-12 sm:h-14 w-auto object-contain"
            />
            <span className="text-xs tracking-widest uppercase" style={{ color: ON_DARK_MUTED, fontFamily: "ui-monospace, monospace" }}>
              School of Data Science
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm hover:opacity-90 transition-opacity"
              style={{ color: "#FFFFFF" }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: "#FFFFFF" }}>
              <Home size={16} /> Home
            </Link>
          </div>
        </div>

        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
          Course catalog
        </p>
        <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
          Browse by category
        </h1>
        <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
          Click a bucket to see its courses — Core (Gen Ed, Computing, DS Core, Capstone) or Electives outside the major.
        </p>

        <CatalogBrowser />
      </div>
    </div>
  );
}
