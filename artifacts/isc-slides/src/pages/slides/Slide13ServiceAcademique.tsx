export default function Slide13ServiceAcademique() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            Le service académique valide les dossiers et gère les inscriptions
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-2 gap-[4vw] flex-1 items-center">
          <div className="flex flex-col gap-[2.5vh]">
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              Tableau de bord dédié : liste des dossiers avec filtrage par statut.
            </p>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              Chaque dossier affiche les documents uploadés, les informations étudiant et l'historique de traitement.
            </p>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              La validation envoie automatiquement un email de confirmation à l'étudiant.
            </p>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              Rôles autorisés : ACADEMIC_SERVICE, ADMIN, DIRECTOR.
            </p>
          </div>

          <div className="flex flex-col gap-[1.5vh]">
            <p className="font-bold mb-[1vh]" style={{ fontSize: "2.6vw", color: "#1e3a5f" }}>Statuts des dossiers</p>
            <div className="flex items-center justify-between px-[2vw] py-[1.2vh] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f15" }}>
              <span style={{ fontSize: "2.5vw", color: "#374151" }}>PENDING</span>
              <span className="font-bold" style={{ fontSize: "2.4vw", color: "#6b7280" }}>En attente</span>
            </div>
            <div className="flex items-center justify-between px-[2vw] py-[1.2vh] rounded" style={{ background: "#d9770610", border: "1px solid #d9770630" }}>
              <span style={{ fontSize: "2.5vw", color: "#374151" }}>UNDER_REVIEW</span>
              <span className="font-bold" style={{ fontSize: "2.4vw", color: "#b45309" }}>En traitement</span>
            </div>
            <div className="flex items-center justify-between px-[2vw] py-[1.2vh] rounded" style={{ background: "#d9770625", border: "1px solid #d97706" }}>
              <span style={{ fontSize: "2.5vw", color: "#374151" }}>APPROVED</span>
              <span className="font-bold" style={{ fontSize: "2.4vw", color: "#d97706" }}>Email envoyé</span>
            </div>
            <div className="flex items-center justify-between px-[2vw] py-[1.2vh] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <span style={{ fontSize: "2.5vw", color: "#374151" }}>REJECTED</span>
              <span className="font-bold" style={{ fontSize: "2.4vw", color: "#6b7280" }}>Avec motif</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>13 / 17</p>
        </div>
      </div>
    </div>
  );
}
