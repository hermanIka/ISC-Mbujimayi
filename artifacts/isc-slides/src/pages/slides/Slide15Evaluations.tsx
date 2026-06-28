export default function Slide15Evaluations() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            Les évaluations et certificats ferment la boucle du parcours académique
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-2 gap-[4vw] flex-1 items-center">
          <div className="flex flex-col gap-[2.5vh]">
            <div>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Types d'évaluation</p>
              <div className="flex gap-[1.2vw] mt-[1vh]">
                <div className="px-[1.2vw] py-[0.8vh] rounded font-bold text-white" style={{ background: "#1e3a5f", fontSize: "2.3vw" }}>Quiz</div>
                <div className="px-[1.2vw] py-[0.8vh] rounded font-bold text-white" style={{ background: "#1e3a5f", fontSize: "2.3vw" }}>Devoir</div>
                <div className="px-[1.2vw] py-[0.8vh] rounded font-bold text-white" style={{ background: "#d97706", fontSize: "2.3vw" }}>Examen final</div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Stockage des résultats</p>
              <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.5 }}>
                Réponses détaillées en JSON dans evaluation_results, consultables pour révision pédagogique.
              </p>
            </div>

            <div>
              <p className="font-bold mb-[1vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Certificat automatique</p>
              <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.5 }}>
                Généré à la réussite de l'évaluation finale. Hash unique pour vérification d'authenticité en ligne.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-full rounded" style={{ border: "2px solid #d97706", padding: "3vw" }}>
              <div className="text-center mb-[2vh]">
                <div className="w-[5vw] h-[5vw] rounded-full mx-auto mb-[1.5vh] flex items-center justify-center font-bold text-white" style={{ background: "#d97706", fontSize: "3vw" }}>
                  ★
                </div>
                <p className="font-bold" style={{ fontSize: "2.8vw", color: "#1e3a5f" }}>Certificat d'achèvement</p>
              </div>
              <div className="h-[0.2vh] mb-[2vh]" style={{ background: "#d97706" }} />
              <p className="text-center" style={{ fontSize: "2.3vw", color: "#374151" }}>
                ISC Mbujimayi certifie que l'étudiant a complété avec succès le cours et réussi l'évaluation finale.
              </p>
              <div className="flex justify-between mt-[2vh]">
                <div>
                  <div className="h-[0.15vh] mb-[0.5vh] w-[8vw]" style={{ background: "#1e3a5f40" }} />
                  <p style={{ fontSize: "2vw", color: "#9ca3af" }}>Étudiant</p>
                </div>
                <div>
                  <div className="h-[0.15vh] mb-[0.5vh] w-[8vw]" style={{ background: "#1e3a5f40" }} />
                  <p style={{ fontSize: "2vw", color: "#9ca3af" }}>Directeur ISC</p>
                </div>
              </div>
              <p className="text-center mt-[1.5vh]" style={{ fontSize: "1.8vw", color: "#d97706" }}>
                hash: a3f7e8d2... — vérifiable en ligne
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>15 / 17</p>
        </div>
      </div>
    </div>
  );
}
