export default function Slide06Flux() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[3vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            Les flux de données suivent trois parcours distincts et interconnectés
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="flex flex-col gap-[2.5vh] flex-1 justify-center">
          <div className="p-[1.8vw] rounded" style={{ background: "#1e3a5f0a", border: "1px solid #1e3a5f20" }}>
            <p className="font-bold mb-[0.8vh]" style={{ fontSize: "2.6vw", color: "#d97706" }}>Parcours 1 — Inscription</p>
            <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.45 }}>
              Visiteur → pre_register → users + students + payments + inscriptions (UNDER_REVIEW) → validation académique → email de confirmation
            </p>
          </div>

          <div className="p-[1.8vw] rounded" style={{ background: "#1e3a5f0a", border: "1px solid #1e3a5f20" }}>
            <p className="font-bold mb-[0.8vh]" style={{ fontSize: "2.6vw", color: "#d97706" }}>Parcours 2 — Cours</p>
            <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.45 }}>
              Enseignant crée → DRAFT → PENDING_REVIEW → PUBLISHED ; étudiant paie → enrollment créé automatiquement → progression chapitre par chapitre → certificat
            </p>
          </div>

          <div className="p-[1.8vw] rounded" style={{ background: "#1e3a5f0a", border: "1px solid #1e3a5f20" }}>
            <p className="font-bold mb-[0.8vh]" style={{ fontSize: "2.6vw", color: "#d97706" }}>Parcours 3 — Paiement</p>
            <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.45 }}>
              Initiation → simulateMobileMoneyPayment → CONFIRMED → postPaymentService déclenche l'action correspondante (inscription ou accès cours)
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>6 / 17</p>
        </div>
      </div>
    </div>
  );
}
