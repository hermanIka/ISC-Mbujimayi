const base = import.meta.env.BASE_URL;

export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary font-body">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2440 60%, #1e3a5f 100%)" }}
      />
      <div className="absolute top-0 right-0 w-[40vw] h-full opacity-10">
        <div
          className="w-full h-full"
          style={{ background: "repeating-linear-gradient(45deg, #d97706 0px, #d97706 1px, transparent 1px, transparent 40px)" }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[0.6vh]" style={{ background: "#d97706" }} />
      <div className="relative z-10 flex flex-col h-full px-[8vw] py-[8vh]">
        <div className="flex items-center gap-[1.5vw] mb-auto">
          <img
            src={`${base}isc-home.jpg`}
            crossOrigin="anonymous"
            alt="ISC Mbujimayi"
            className="w-[4vw] h-[4vw] rounded object-cover opacity-80"
          />
          <span className="text-white opacity-70 font-display" style={{ fontSize: "2.2vw", letterSpacing: "0.05em" }}>
            ISC MBUJIMAYI
          </span>
        </div>

        <div className="flex flex-col justify-center flex-1">
          <div className="w-[6vw] h-[0.4vh] mb-[3vh]" style={{ background: "#d97706" }} />
          <h1
            className="text-white font-display font-bold leading-tight mb-[3vh]"
            style={{ fontSize: "6vw", letterSpacing: "-0.02em", textWrap: "balance" }}
          >
            Plateforme Digitale
          </h1>
          <h2
            className="font-display font-bold mb-[4vh]"
            style={{ fontSize: "3.2vw", color: "#d97706", letterSpacing: "0.01em" }}
          >
            Institut Supérieur de Commerce de Mbujimayi
          </h2>
          <p className="text-white opacity-60 font-body" style={{ fontSize: "2.6vw" }}>
            Soutenance de projet — Juin 2026
          </p>
        </div>

        <div className="flex items-end justify-between">
          <p className="text-white opacity-40 font-body" style={{ fontSize: "2.2vw" }}>
            Confidentiel — Jury de défense
          </p>
          <p className="text-white opacity-40 font-body" style={{ fontSize: "2.2vw" }}>
            1 / 17
          </p>
        </div>
      </div>
    </div>
  );
}
