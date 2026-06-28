const base = import.meta.env.BASE_URL;

export default function Slide07InscriptionEtape1() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex h-full">
        <div className="flex flex-col justify-between px-[6vw] py-[7vh]" style={{ width: "48%" }}>
          <div>
            <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.2vw", color: "#1e3a5f", textWrap: "balance" }}>
              Étape 1 : le visiteur choisit son profil
            </h2>
            <div className="w-[5vw] h-[0.35vh] mb-[3vh]" style={{ background: "#d97706" }} />

            <p className="mb-[2vh]" style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.45 }}>
              Formulaire en 5 étapes guidées :
            </p>
            <div className="flex gap-[0.8vw] flex-wrap mb-[3vh]">
              <span className="px-[0.8vw] py-[0.4vh] rounded font-bold text-white" style={{ background: "#d97706", fontSize: "2.3vw" }}>Rôle</span>
              <span style={{ fontSize: "2.3vw", color: "#9ca3af", alignSelf: "center" }}>→</span>
              <span className="px-[0.8vw] py-[0.4vh] rounded" style={{ background: "#1e3a5f15", fontSize: "2.3vw", color: "#1e3a5f" }}>Infos</span>
              <span style={{ fontSize: "2.3vw", color: "#9ca3af", alignSelf: "center" }}>→</span>
              <span className="px-[0.8vw] py-[0.4vh] rounded" style={{ background: "#1e3a5f15", fontSize: "2.3vw", color: "#1e3a5f" }}>Docs</span>
              <span style={{ fontSize: "2.3vw", color: "#9ca3af", alignSelf: "center" }}>→</span>
              <span className="px-[0.8vw] py-[0.4vh] rounded" style={{ background: "#1e3a5f15", fontSize: "2.3vw", color: "#1e3a5f" }}>Filière</span>
              <span style={{ fontSize: "2.3vw", color: "#9ca3af", alignSelf: "center" }}>→</span>
              <span className="px-[0.8vw] py-[0.4vh] rounded" style={{ background: "#1e3a5f15", fontSize: "2.3vw", color: "#1e3a5f" }}>Paiement</span>
            </div>

            <p className="mb-[1.5vh]" style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.45 }}>
              Trois profils disponibles : Étudiant, Enseignant, Personnel administratif.
            </p>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.45 }}>
              Chaque profil déclenche un flux de données distinct en base.
            </p>
          </div>
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>7 / 17</p>
        </div>

        <div className="flex items-center justify-center py-[6vh] pr-[5vw]" style={{ width: "52%" }}>
          <img
            src={`${base}isc-register.jpg`}
            crossOrigin="anonymous"
            alt="Sélection de profil — étape 1"
            className="w-full h-full object-contain rounded"
            style={{ boxShadow: "0 4px 32px #1e3a5f18", border: "1px solid #1e3a5f15" }}
          />
        </div>
      </div>
    </div>
  );
}
