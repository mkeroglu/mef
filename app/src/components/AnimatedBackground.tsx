export default function AnimatedBackground() {
  return (
    <div className="flow-bg" aria-hidden="true">
      <div
        className="flow-blob"
        style={{
          width: "38vw",
          height: "38vw",
          left: "-8vw",
          top: "10vh",
          background: "radial-gradient(circle, rgba(184,137,76,0.35), transparent 70%)",
          animationDelay: "0s",
        }}
      />
      <div
        className="flow-blob"
        style={{
          width: "30vw",
          height: "30vw",
          right: "-6vw",
          top: "40vh",
          background: "radial-gradient(circle, rgba(143,168,143,0.3), transparent 70%)",
          animationDelay: "3s",
        }}
      />
      <div
        className="flow-blob"
        style={{
          width: "34vw",
          height: "34vw",
          left: "20vw",
          bottom: "-14vh",
          background: "radial-gradient(circle, rgba(217,184,119,0.4), transparent 70%)",
          animationDelay: "6s",
        }}
      />
    </div>
  );
}
