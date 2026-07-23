import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import PersonalPlanPanel from "./PersonalPlanPanel";
import CatalogBrowser from "./CatalogBrowser";
import { RegistrationPanel } from "./Registration";

const PAGE_BG = "#00543C";
const GOLD = "#B3A369";
const ON_DARK_MUTED = "#BFD9CB";

/**
 * Register courses — your plan + course catalog + registration search.
 */
export default function RegisterCourses() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen" style={{ background: PAGE_BG }}>
      <style>{`
        .preferred-load-input::-webkit-outer-spin-button,
        .preferred-load-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .preferred-load-input { -moz-appearance: textfield; appearance: textfield; }
      `}</style>

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
          Register courses
        </p>
        <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
          Plan, browse, and register.
        </h1>
        <p className="text-base mb-10 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
          Review what to take next, browse the catalog, then search and add sections for the term ahead.
        </p>

        <PersonalPlanPanel compact />

        <p className="text-xs tracking-widest uppercase mb-2 mt-4" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
          Course catalog
        </p>
        <h2 className="text-3xl sm:text-4xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
          Browse by category
        </h2>
        <p className="text-base mb-6 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
          Core (Gen Ed, Computing, DS Core, Capstone) and Electives outside the major.
        </p>

        <div className="mb-12">
          <CatalogBrowser showRegisterCta={false} registerPath="/register-courses" />
        </div>

        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
          Registration
        </p>
        <h2 className="text-3xl sm:text-4xl mb-6 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
          Search and add sections
        </h2>

        <RegistrationPanel showHeading={false} showCatalogLink={false} />
      </div>
    </div>
  );
}
