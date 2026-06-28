export default function Slide11Apprentissage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            L'interface d'apprentissage guide l'étudiant chapitre par chapitre
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-2 gap-[4vw] flex-1 items-center">
          <div className="flex flex-col gap-[2.5vh]">
            <div className="flex gap-[1.5vw] items-start">
              <div className="w-[0.4vw] self-stretch flex-shrink-0" style={{ background: "#d97706" }} />
              <div>
                <p className="font-bold mb-[0.5vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Navigation par modules et chapitres</p>
                <p style={{ fontSize: "2.5vw", color: "#4b5563", lineHeight: 1.45 }}>
                  Panneau latéral listant l'arborescence complète du cours.
                </p>
              </div>
            </div>

            <div className="flex gap-[1.5vw] items-start">
              <div className="w-[0.4vw] self-stretch flex-shrink-0" style={{ background: "#d97706" }} />
              <div>
                <p className="font-bold mb-[0.5vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Types de contenu supportés</p>
                <p style={{ fontSize: "2.5vw", color: "#4b5563", lineHeight: 1.45 }}>
                  Lecture vidéo ou affichage PDF selon le type de chapitre défini par l'enseignant.
                </p>
              </div>
            </div>

            <div className="flex gap-[1.5vw] items-start">
              <div className="w-[0.4vw] self-stretch flex-shrink-0" style={{ background: "#d97706" }} />
              <div>
                <p className="font-bold mb-[0.5vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Progression granulaire</p>
                <p style={{ fontSize: "2.5vw", color: "#4b5563", lineHeight: 1.45 }}>
                  Enregistrée à la seconde près (watchedSeconds) dans chapter_progress.
                </p>
              </div>
            </div>

            <div className="flex gap-[1.5vw] items-start">
              <div className="w-[0.4vw] self-stretch flex-shrink-0" style={{ background: "#d97706" }} />
              <div>
                <p className="font-bold mb-[0.5vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Évaluations conditionnelles</p>
                <p style={{ fontSize: "2.5vw", color: "#4b5563", lineHeight: 1.45 }}>
                  Débloquées après complétion des modules requis.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center h-full py-[2vh]">
            <div className="rounded overflow-hidden" style={{ border: "1px solid #1e3a5f20", boxShadow: "0 4px 24px #1e3a5f10" }}>
              <div className="px-[1.5vw] py-[1.5vh] font-bold" style={{ background: "#1e3a5f", color: "white", fontSize: "2.4vw" }}>
                /courses/:id/learn
              </div>
              <div className="flex" style={{ background: "#f1f5f9", minHeight: "30vh" }}>
                <div className="py-[1.5vh] px-[1vw]" style={{ width: "35%", borderRight: "1px solid #1e3a5f15" }}>
                  <p className="font-bold mb-[1vh]" style={{ fontSize: "2.2vw", color: "#1e3a5f" }}>Module 1</p>
                  <div className="mb-[0.5vh] px-[0.8vw] py-[0.4vh] rounded" style={{ background: "#d97706", fontSize: "2vw", color: "white" }}>Chap. 1 ✓</div>
                  <div className="mb-[0.5vh] px-[0.8vw] py-[0.4vh] rounded" style={{ background: "#d9770640", fontSize: "2vw", color: "#1e3a5f" }}>Chap. 2</div>
                  <div className="px-[0.8vw] py-[0.4vh] rounded" style={{ background: "#1e3a5f10", fontSize: "2vw", color: "#6b7280" }}>Chap. 3</div>
                </div>
                <div className="flex-1 flex items-center justify-center p-[2vw]">
                  <div className="text-center">
                    <div className="w-[6vw] h-[4vh] rounded mx-auto mb-[1vh]" style={{ background: "#1e3a5f20" }} />
                    <p style={{ fontSize: "2vw", color: "#6b7280" }}>Lecteur vidéo / PDF</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>11 / 17</p>
        </div>
      </div>
    </div>
  );
}
