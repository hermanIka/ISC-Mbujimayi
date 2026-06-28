export default function Slide09Paiement() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            Étape 5 : le paiement mobile finalise l'inscription en temps réel
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-2 gap-[4vw] flex-1 items-center">
          <div className="flex flex-col gap-[3vh]">
            <div>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Opérateurs pris en charge</p>
              <div className="flex gap-[1.5vw] mt-[1.5vh]">
                <div className="px-[1.5vw] py-[1vh] rounded font-bold" style={{ background: "#d97706", color: "white", fontSize: "2.3vw" }}>M-Pesa</div>
                <div className="px-[1.5vw] py-[1vh] rounded font-bold" style={{ background: "#1e3a5f0d", color: "#1e3a5f", fontSize: "2.3vw", border: "1px solid #1e3a5f20" }}>Airtel Money</div>
                <div className="px-[1.5vw] py-[1vh] rounded font-bold" style={{ background: "#1e3a5f0d", color: "#1e3a5f", fontSize: "2.3vw", border: "1px solid #1e3a5f20" }}>Orange Money</div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Saisies requises</p>
              <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
                Numéro de téléphone et confirmation du montant des frais d'inscription.
              </p>
            </div>

            <div>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Actions atomiques à la confirmation</p>
              <p style={{ fontSize: "2.6vw", color: "#374151", lineHeight: 1.5 }}>
                Création du compte utilisateur, dossier d'inscription (UNDER_REVIEW), et email de bienvenue envoyé via Resend.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-[2vh]">
            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f", color: "white" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.5vw", color: "#d97706" }}>INITIATED</p>
              <p style={{ fontSize: "2.3vw", opacity: 0.8 }}>Enregistrement de la demande en base</p>
            </div>
            <div className="self-center w-[0.3vw] h-[2.5vh]" style={{ background: "#d97706" }} />
            <div className="p-[2vw] rounded" style={{ background: "#1e3a5f40", border: "1px solid #1e3a5f30" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.5vw", color: "#1e3a5f" }}>PENDING</p>
              <p style={{ fontSize: "2.3vw", color: "#374151" }}>Traitement opérateur simulé</p>
            </div>
            <div className="self-center w-[0.3vw] h-[2.5vh]" style={{ background: "#d97706" }} />
            <div className="p-[2vw] rounded" style={{ background: "#d9770615", border: "1px solid #d97706" }}>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.5vw", color: "#d97706" }}>CONFIRMED</p>
              <p style={{ fontSize: "2.3vw", color: "#374151" }}>postPaymentService déclenche l'action liée</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>9 / 17</p>
        </div>
      </div>
    </div>
  );
}
