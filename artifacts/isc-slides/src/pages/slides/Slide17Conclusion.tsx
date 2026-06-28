export default function Slide17Conclusion() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2440 60%, #1e3a5f 100%)" }}>
      <div className="absolute top-0 right-0 w-[35vw] h-full opacity-10">
        <div
          className="w-full h-full"
          style={{ background: "repeating-linear-gradient(45deg, #d97706 0px, #d97706 1px, transparent 1px, transparent 40px)" }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[0.6vh]" style={{ background: "#d97706" }} />

      <div className="relative z-10 flex flex-col h-full px-[8vw] py-[8vh]">
        <div className="mb-[2vh]">
          <div className="w-[6vw] h-[0.4vh] mb-[3vh]" style={{ background: "#d97706" }} />
          <h2 className="font-display font-bold leading-tight mb-[1.5vh] text-white" style={{ fontSize: "4.5vw", textWrap: "balance" }}>
            La plateforme numérise l'ISC Mbujimayi de bout en bout
          </h2>
        </div>

        <div className="flex flex-col gap-[2.5vh] flex-1 justify-center">
          <div className="flex gap-[2vw] items-start">
            <div className="w-[0.4vw] flex-shrink-0 self-stretch" style={{ background: "#d97706" }} />
            <p className="text-white" style={{ fontSize: "2.8vw", lineHeight: 1.45, opacity: 0.9 }}>
              Inscription, paiement, cours, évaluation et certification : un seul système intégré.
            </p>
          </div>
          <div className="flex gap-[2vw] items-start">
            <div className="w-[0.4vw] flex-shrink-0 self-stretch" style={{ background: "#d97706" }} />
            <p className="text-white" style={{ fontSize: "2.8vw", lineHeight: 1.45, opacity: 0.9 }}>
              Stack moderne, déployé sur cloud, extensible sans migration de données.
            </p>
          </div>
          <div className="flex gap-[2vw] items-start">
            <div className="w-[0.4vw] flex-shrink-0 self-stretch" style={{ background: "#d97706" }} />
            <p className="text-white" style={{ fontSize: "2.8vw", lineHeight: 1.45, opacity: 0.9 }}>
              Prochaines étapes : intégration API réelle des opérateurs mobiles, application mobile Expo, tableau de bord analytique pour la direction.
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between mt-[4vh]">
          <div>
            <p className="font-bold text-white mb-[0.5vh]" style={{ fontSize: "2.8vw" }}>
              Institut Supérieur de Commerce de Mbujimayi
            </p>
            <p style={{ fontSize: "2.4vw", color: "#d97706" }}>
              Mbujimayi, RDC — isc-mbujimayi.replit.app
            </p>
          </div>
          <p style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.4)" }}>17 / 17</p>
        </div>
      </div>
    </div>
  );
}
