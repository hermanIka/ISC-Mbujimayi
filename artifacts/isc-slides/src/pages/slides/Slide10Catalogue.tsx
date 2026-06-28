const base = import.meta.env.BASE_URL;

export default function Slide10Catalogue() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex h-full">
        <div className="flex flex-col justify-between px-[6vw] py-[7vh]" style={{ width: "46%" }}>
          <div>
            <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.2vw", color: "#1e3a5f", textWrap: "balance" }}>
              Le catalogue de cours est accessible avant même l'inscription
            </h2>
            <div className="w-[5vw] h-[0.35vh] mb-[3.5vh]" style={{ background: "#d97706" }} />

            <p className="mb-[2vh]" style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              Les cours publiés sont visibles pour tous les visiteurs en lecture seule.
            </p>
            <p className="mb-[2vh]" style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              Chaque cours affiche : filière, niveau (L1/L2/L3), durée en heures, enseignant responsable.
            </p>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              L'accès complet au contenu est débloqué après paiement des frais de cours.
            </p>
          </div>
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>10 / 17</p>
        </div>

        <div className="flex items-center justify-center py-[6vh] pr-[5vw]" style={{ width: "54%" }}>
          <img
            src={`${base}isc-courses.jpg`}
            crossOrigin="anonymous"
            alt="Catalogue de cours"
            className="w-full h-full object-contain rounded"
            style={{ boxShadow: "0 4px 32px #1e3a5f18", border: "1px solid #1e3a5f15" }}
          />
        </div>
      </div>
    </div>
  );
}
