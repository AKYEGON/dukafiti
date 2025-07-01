import { createRoot } from "react-dom/client";

// Simple test component to verify React is working
function TestApp() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>React Test App</h1>
      <p>If you see this, React is working!</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<TestApp />);