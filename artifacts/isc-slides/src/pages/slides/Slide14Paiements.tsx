export default function Slide14Paiements() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body" style={{ background: "#f8f7f4" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.5vw]" style={{ background: "#1e3a5f" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh]" style={{ background: "#d97706" }} />

      <div className="flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <h2 className="font-display font-bold leading-tight mb-[1vh]" style={{ fontSize: "3.4vw", color: "#1e3a5f", textWrap: "balance" }}>
            Les paiements sont traçables et liés à chaque transaction académique
          </h2>
          <div className="w-[6vw] h-[0.35vh]" style={{ background: "#d97706" }} />
        </div>

        <div className="grid grid-cols-2 gap-[4vw] flex-1 items-start">
          <div className="flex flex-col gap-[2.5vh]">
            <div>
              <p className="font-bold mb-[1.5vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Données enregistrées par transaction</p>
              <p style={{ fontSize: "2.5vw", color: "#374151", lineHeight: 1.5 }}>
                Montant, opérateur, numéro de téléphone, référence unique, horodatage et référence opérateur (operatorRef).
              </p>
            </div>

            <div>
              <p className="font-bold mb-[1.5vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Types de paiement</p>
              <div className="flex gap-[1vw] flex-wrap">
                <span className="px-[1vw] py-[0.5vh] rounded text-white" style={{ background: "#1e3a5f", fontSize: "2.2vw" }}>INSCRIPTION_FEE</span>
                <span className="px-[1vw] py-[0.5vh] rounded text-white" style={{ background: "#1e3a5f", fontSize: "2.2vw" }}>COURSE_FEE</span>
                <span className="px-[1vw] py-[0.5vh] rounded text-white" style={{ background: "#1e3a5f", fontSize: "2.2vw" }}>EXAM_FEE</span>
                <span className="px-[1vw] py-[0.5vh] rounded" style={{ background: "#1e3a5f20", color: "#1e3a5f", fontSize: "2.2vw" }}>OTHER</span>
              </div>
            </div>
          </div>

          <div>
            <p className="font-bold mb-[2vh]" style={{ fontSize: "2.7vw", color: "#1e3a5f" }}>Cycle de statut</p>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1e3a5f", color: "white" }}>
                  <th className="text-left px-[1vw] py-[1vh]" style={{ fontSize: "2.3vw" }}>Statut</th>
                  <th className="text-left px-[1vw] py-[1vh]" style={{ fontSize: "2.3vw" }}>Signification</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#f8f7f4", borderBottom: "1px solid #1e3a5f10" }}>
                  <td className="px-[1vw] py-[1vh] font-bold" style={{ fontSize: "2.3vw", color: "#6b7280" }}>INITIATED</td>
                  <td className="px-[1vw] py-[1vh]" style={{ fontSize: "2.3vw", color: "#374151" }}>Demande créée en base</td>
                </tr>
                <tr style={{ background: "#1e3a5f05", borderBottom: "1px solid #1e3a5f10" }}>
                  <td className="px-[1vw] py-[1vh] font-bold" style={{ fontSize: "2.3vw", color: "#b45309" }}>PENDING</td>
                  <td className="px-[1vw] py-[1vh]" style={{ fontSize: "2.3vw", color: "#374151" }}>Traitement en cours</td>
                </tr>
                <tr style={{ background: "#d9770608", borderBottom: "1px solid #1e3a5f10" }}>
                  <td className="px-[1vw] py-[1vh] font-bold" style={{ fontSize: "2.3vw", color: "#d97706" }}>CONFIRMED</td>
                  <td className="px-[1vw] py-[1vh]" style={{ fontSize: "2.3vw", color: "#374151" }}>Action post-paiement déclenchée</td>
                </tr>
                <tr style={{ background: "#f8f7f4", borderBottom: "1px solid #1e3a5f10" }}>
                  <td className="px-[1vw] py-[1vh] font-bold" style={{ fontSize: "2.3vw", color: "#9ca3af" }}>FAILED</td>
                  <td className="px-[1vw] py-[1vh]" style={{ fontSize: "2.3vw", color: "#374151" }}>Échec opérateur</td>
                </tr>
                <tr style={{ background: "#1e3a5f05" }}>
                  <td className="px-[1vw] py-[1vh] font-bold" style={{ fontSize: "2.3vw", color: "#9ca3af" }}>CANCELLED</td>
                  <td className="px-[1vw] py-[1vh]" style={{ fontSize: "2.3vw", color: "#374151" }}>Annulé par l'utilisateur</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mt-[2vh]">
          <p style={{ fontSize: "2.2vw", color: "#9ca3af" }}>14 / 17</p>
        </div>
      </div>
    </div>
  );
}
