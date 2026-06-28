export default function Slide04Architecture() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2
            className="font-display font-bold leading-tight mb-[1vh]"
            style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}
          >
            Architecture technique : React + Express + PostgreSQL sur cloud
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-3 gap-[2.5vw] flex-1 items-start">
          <div>
            <p className="font-bold mb-[2vh] pb-[1vh]" style={{ fontSize: "2.8vw", color: "#d97706", borderBottom: "1px solid #d9770640" }}>
              Frontend
            </p>
            <p className="mb-[1.5vh]" style={{ fontSize: "2.6vw", color: "#1a1a2e", lineHeight: 1.45 }}>
              React 18 + Vite + Tailwind CSS
            </p>
            <p style={{ fontSize: "2.6vw", color: "#4b5563", lineHeight: 1.45 }}>
              Déployé sur Replit Cloud Run avec autoscale. PWA avec service worker.
            </p>
          </div>
          <div>
            <p className="font-bold mb-[2vh] pb-[1vh]" style={{ fontSize: "2.8vw", color: "#d97706", borderBottom: "1px solid #d9770640" }}>
              Backend
            </p>
            <p className="mb-[1.5vh]" style={{ fontSize: "2.6vw", color: "#1a1a2e", lineHeight: 1.45 }}>
              Express 5 (API REST) + Drizzle ORM + PostgreSQL
            </p>
            <p style={{ fontSize: "2.6vw", color: "#4b5563", lineHeight: 1.45 }}>
              Stockage : Google Cloud Storage via presigned URLs.
            </p>
          </div>
          <div>
            <p className="font-bold mb-[2vh] pb-[1vh]" style={{ fontSize: "2.8vw", color: "#d97706", borderBottom: "1px solid #d9770640" }}>
              Services tiers
            </p>
            <p className="mb-[1.5vh]" style={{ fontSize: "2.6vw", color: "#1a1a2e", lineHeight: 1.45 }}>
              Resend API — emails transactionnels
            </p>
            <p style={{ fontSize: "2.6vw", color: "#4b5563", lineHeight: 1.45 }}>
              Clerk — authentification (mode bypass pour le prototype de démonstration).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-[3vw] mt-[3vh] pt-[2vh]" style={{ borderTop: "1px solid #1e3a5f20" }}>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[1vw] h-[1vw] rounded-full" style={{ background: "#d97706" }} />
            <p style={{ fontSize: "2.4vw", color: "#6b7280" }}>Monorepo pnpm</p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[1vw] h-[1vw] rounded-full" style={{ background: "#d97706" }} />
            <p style={{ fontSize: "2.4vw", color: "#6b7280" }}>TypeScript end-to-end</p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[1vw] h-[1vw] rounded-full" style={{ background: "#d97706" }} />
            <p style={{ fontSize: "2.4vw", color: "#6b7280" }}>Drizzle schema comme source de vérité</p>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>4 / 17</p>
        </div>
      </div>
    </div>
  );
}
