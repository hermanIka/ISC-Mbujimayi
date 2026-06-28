export default function Slide05BaseDeDonnees() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[3.5vh]">
          <h2
            className="font-display font-bold leading-tight mb-[1vh]"
            style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}
          >
            La base de données structure 18 entités autour de 5 domaines
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-5 gap-[1.5vw] flex-1 items-stretch">
          <div className="flex flex-col rounded overflow-hidden" style={{ border: "1px solid #1e3a5f25" }}>
            <div className="px-[1vw] py-[1.2vh] font-bold text-white text-center" style={{ background: "#1e3a5f", fontSize: "2.4vw" }}>
              Identité
            </div>
            <div className="flex-1 px-[1vw] py-[1.5vh]" style={{ background: "#1e3a5f08" }}>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>users</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>students</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>teachers</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>teacher_reg.</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>staff_reg.</p>
            </div>
          </div>

          <div className="flex flex-col rounded overflow-hidden" style={{ border: "1px solid #1e3a5f25" }}>
            <div className="px-[1vw] py-[1.2vh] font-bold text-white text-center" style={{ background: "#d97706", fontSize: "2.4vw" }}>
              Académique
            </div>
            <div className="flex-1 px-[1vw] py-[1.5vh]" style={{ background: "#d9770608" }}>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>filieres</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>inscriptions</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>enrollments</p>
            </div>
          </div>

          <div className="flex flex-col rounded overflow-hidden" style={{ border: "1px solid #1e3a5f25" }}>
            <div className="px-[1vw] py-[1.2vh] font-bold text-white text-center" style={{ background: "#1e3a5f", fontSize: "2.4vw" }}>
              Contenu
            </div>
            <div className="flex-1 px-[1vw] py-[1.5vh]" style={{ background: "#1e3a5f08" }}>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>courses</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>modules</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>chapters</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>materials</p>
            </div>
          </div>

          <div className="flex flex-col rounded overflow-hidden" style={{ border: "1px solid #1e3a5f25" }}>
            <div className="px-[1vw] py-[1.2vh] font-bold text-white text-center" style={{ background: "#d97706", fontSize: "2.4vw" }}>
              Évaluation
            </div>
            <div className="flex-1 px-[1vw] py-[1.5vh]" style={{ background: "#d9770608" }}>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>evaluations</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>questions</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>results</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>certificates</p>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>progress</p>
            </div>
          </div>

          <div className="flex flex-col rounded overflow-hidden" style={{ border: "1px solid #1e3a5f25" }}>
            <div className="px-[1vw] py-[1.2vh] font-bold text-white text-center" style={{ background: "#1e3a5f", fontSize: "2.4vw" }}>
              Finance
            </div>
            <div className="flex-1 px-[1vw] py-[1.5vh]" style={{ background: "#1e3a5f08" }}>
              <p style={{ fontSize: "2.2vw", color: "#374151", lineHeight: 1.6 }}>payments</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-[2.5vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>Source : schéma Drizzle ORM — lib/db/schema.ts</p>
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>5 / 17</p>
        </div>
      </div>
    </div>
  );
}
