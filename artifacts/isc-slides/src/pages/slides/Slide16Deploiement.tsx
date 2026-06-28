export default function Slide16Deploiement() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            La plateforme est déployée en production et accessible publiquement
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-2 gap-[4vw] flex-1 items-start">
          <div className="flex flex-col gap-[3vh]">
            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.6vw", color: "#1e3a5f" }}>URL de production</p>
              <p style={{ fontSize: "2.5vw", color: "#d97706", fontFamily: "monospace" }}>
                isc-mbujimayi.replit.app
              </p>
            </div>

            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.6vw", color: "#1e3a5f" }}>Infrastructure</p>
              <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.5 }}>
                Replit Cloud Run (autoscale), PostgreSQL managé, Google Cloud Storage pour les objets.
              </p>
            </div>

            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.6vw", color: "#1e3a5f" }}>Build frontend</p>
              <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.5 }}>
                React SPA avec PWA (service worker, cache offline partiel), bundle optimisé Vite.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-[3vh]">
            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.6vw", color: "#1e3a5f" }}>Emails transactionnels</p>
              <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.5 }}>
                Resend API actif — domaine vérifié isc-mbujimayi.ac.cd.
              </p>
            </div>

            <div className="p-[2vw] rounded" style={{ background: "#d97706", color: "white" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.6vw" }}>5 personas de démonstration</p>
              <p style={{ fontSize: "2.5vw", lineHeight: 1.5, opacity: 0.9 }}>
                Couvrant tous les rôles : étudiant, enseignant, appariteur, financier, admin.
              </p>
            </div>

            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.6vw", color: "#1e3a5f" }}>Sécurité</p>
              <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.5 }}>
                Variables d'environnement secrets via Replit. Presigned URLs GCS à durée limitée.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>16 / 17</p>
        </div>
      </div>
    </div>
  );
}
