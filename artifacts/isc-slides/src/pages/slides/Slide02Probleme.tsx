export default function Slide02Probleme() {
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
            La plateforme répond à trois défis structurels de l'ISC
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="flex flex-col gap-[3.5vh] flex-1 justify-center">
          <div className="flex gap-[2vw] items-start">
            <div
              className="flex-shrink-0 w-[3.5vw] h-[3.5vw] rounded flex items-center justify-center font-bold"
              style={{ background: "#1e3a5f", color: "#d97706", fontSize: "2vw" }}
            >
              1
            </div>
            <div>
              <p className="font-bold mb-[0.5vh]" style={{ fontSize: "3vw", color: "#1e3a5f" }}>
                Gestion académique entièrement sur papier
              </p>
              <p style={{ fontSize: "2.7vw", color: "#4b5563" }}>
                Inscriptions, dossiers et suivi étudiant sans traçabilité numérique.
              </p>
            </div>
          </div>

          <div className="flex gap-[2vw] items-start">
            <div
              className="flex-shrink-0 w-[3.5vw] h-[3.5vw] rounded flex items-center justify-center font-bold"
              style={{ background: "#1e3a5f", color: "#d97706", fontSize: "2vw" }}
            >
              2
            </div>
            <div>
              <p className="font-bold mb-[0.5vh]" style={{ fontSize: "3vw", color: "#1e3a5f" }}>
                Aucun accès aux cours hors des salles
              </p>
              <p style={{ fontSize: "2.7vw", color: "#4b5563" }}>
                La continuité pédagogique dépendait de la présence physique.
              </p>
            </div>
          </div>

          <div className="flex gap-[2vw] items-start">
            <div
              className="flex-shrink-0 w-[3.5vw] h-[3.5vw] rounded flex items-center justify-center font-bold"
              style={{ background: "#1e3a5f", color: "#d97706", fontSize: "2vw" }}
            >
              3
            </div>
            <div>
              <p className="font-bold mb-[0.5vh]" style={{ fontSize: "3vw", color: "#1e3a5f" }}>
                Paiements uniquement à la caisse physique
              </p>
              <p style={{ fontSize: "2.7vw", color: "#4b5563" }}>
                Les frais académiques nécessitaient un déplacement obligatoire.
              </p>
            </div>
          </div>
        </div>

        <div
          className="mt-[3vh] px-[2vw] py-[1.5vh] rounded"
          style={{ background: "#1e3a5f10", borderLeft: "0.3vw solid #d97706" }}
        >
          <p style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>
            Résultat : une expérience étudiante fragmentée et une charge administrative élevée.
          </p>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>2 / 17</p>
        </div>
      </div>
    </div>
  );
}
