export default function Slide12Enseignants() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            Les enseignants créent et soumettent les cours via un éditeur dédié
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="flex gap-[4vw] flex-1 items-center">
          <div className="flex flex-col gap-[2.5vh]" style={{ flex: 1 }}>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.45 }}>
              Création par étapes : métadonnées → modules → chapitres → miniature → soumission.
            </p>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.45 }}>
              Upload de miniatures via presigned URL GCS avec prévisualisation immédiate.
            </p>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.45 }}>
              Les cours rejetés peuvent être corrigés et re-soumis sans recréer le dossier.
            </p>
          </div>

          <div style={{ flex: 1 }}>
            <p className="font-bold mb-[2vh]" style={{ fontSize: "2.6vw", color: "#1e3a5f" }}>Cycle de vie d'un cours</p>
            <div className="flex flex-col gap-[1.5vh]">
              <div className="flex items-center gap-[1.5vw]">
                <div className="px-[1.5vw] py-[0.8vh] rounded font-bold" style={{ background: "#1e3a5f15", fontSize: "2.4vw", color: "#1e3a5f", minWidth: "12vw", textAlign: "center" }}>DRAFT</div>
                <div style={{ fontSize: "2.4vw", color: "#9ca3af" }}>→</div>
                <p style={{ fontSize: "2.3vw", color: "#4b5563" }}>En cours de rédaction</p>
              </div>
              <div className="flex items-center gap-[1.5vw]">
                <div className="px-[1.5vw] py-[0.8vh] rounded font-bold" style={{ background: "#d9770620", fontSize: "2.4vw", color: "#b45309", minWidth: "12vw", textAlign: "center" }}>PENDING_REVIEW</div>
                <div style={{ fontSize: "2.4vw", color: "#9ca3af" }}>→</div>
                <p style={{ fontSize: "2.3vw", color: "#4b5563" }}>En attente de validation</p>
              </div>
              <div className="flex items-center gap-[1.5vw]">
                <div className="px-[1.5vw] py-[0.8vh] rounded font-bold" style={{ background: "#d97706", fontSize: "2.4vw", color: "white", minWidth: "12vw", textAlign: "center" }}>PUBLISHED</div>
                <div style={{ fontSize: "2.4vw", color: "#9ca3af" }}>→</div>
                <p style={{ fontSize: "2.3vw", color: "#4b5563" }}>Visible dans le catalogue</p>
              </div>
              <div className="flex items-center gap-[1.5vw]">
                <div className="px-[1.5vw] py-[0.8vh] rounded font-bold" style={{ background: "#1e3a5f08", fontSize: "2.4vw", color: "#6b7280", minWidth: "12vw", textAlign: "center", border: "1px dashed #9ca3af" }}>REJECTED</div>
                <div style={{ fontSize: "2.4vw", color: "#9ca3af" }}>→</div>
                <p style={{ fontSize: "2.3vw", color: "#4b5563" }}>Renvoyé avec notes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>12 / 17</p>
        </div>
      </div>
    </div>
  );
}
