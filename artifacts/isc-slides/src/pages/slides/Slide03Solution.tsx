export default function Slide03Solution() {
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
            La solution couvre l'intégralité du parcours académique étudiant
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-2 gap-[3vw] flex-1">
          <div className="flex flex-col gap-[3vh]">
            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>E-learning</p>
              <p style={{ fontSize: "2.6vw", color: "#4b5563", lineHeight: 1.4 }}>
                Catalogue de cours, modules vidéo/PDF, suivi de progression, certificats automatiques.
              </p>
            </div>
            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Gestion académique</p>
              <p style={{ fontSize: "2.6vw", color: "#4b5563", lineHeight: 1.4 }}>
                Inscription en ligne, dossiers numériques, validation par les services compétents.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-[3vh]">
            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Paiements mobiles</p>
              <p style={{ fontSize: "2.6vw", color: "#4b5563", lineHeight: 1.4 }}>
                M-Pesa, Airtel Money, Orange Money — sans déplacement physique.
              </p>
            </div>
            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f08", border: "1px solid #1e3a5f20" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Portails par rôle</p>
              <p style={{ fontSize: "2.6vw", color: "#4b5563", lineHeight: 1.4 }}>
                Interfaces distinctes : étudiant, enseignant, académique, financier, direction.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>3 / 17</p>
        </div>
      </div>
    </div>
  );
}
