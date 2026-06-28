export default function Slide08InscriptionEtapes2a4() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            Étapes 2 à 4 : informations personnelles, documents et filière
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-3 gap-[3vw] flex-1 items-start">
          <div>
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[3vw] h-[3vw] rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: "#1e3a5f", fontSize: "1.8vw" }}>2</div>
              <p className="font-bold" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Informations</p>
            </div>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              Nom, prénom, date de naissance, téléphone, adresse postale.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[3vw] h-[3vw] rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: "#1e3a5f", fontSize: "1.8vw" }}>3</div>
              <p className="font-bold" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Documents</p>
            </div>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              Upload du Diplôme d'État et de la CNI via presigned URL vers Google Cloud Storage.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[3vw] h-[3vw] rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: "#1e3a5f", fontSize: "1.8vw" }}>4</div>
              <p className="font-bold" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Filière</p>
            </div>
            <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
              Choix parmi les programmes disponibles : Comptabilité, Marketing, Informatique de Gestion, Gestion des RH, Fiscalité.
            </p>
          </div>
        </div>

        <div className="mt-[3vh] pt-[2vh] flex items-start gap-[1.5vw]" style={{ borderTop: "1px solid #1e3a5f15" }}>
          <div className="w-[0.3vw] self-stretch" style={{ background: "#d97706" }} />
          <p style={{ fontSize: "2.5vw", color: "#4b5563", lineHeight: 1.45 }}>
            Les documents sont stockés dans GCS sous un chemin privé par étudiant. L'URL signée expire après 15 minutes — seul le backend peut y accéder.
          </p>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>8 / 17</p>
        </div>
      </div>
    </div>
  );
}
