export function DebugComponent() {
  // Debug component rendering;
  return (
    <div style = {{
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      background: 'red',
      color: 'white',
      padding: '10px',
      fontSize: '16px'
    }}>
      DEBUG: React is working - {new Date().toISOString()}
    </div>
  );
}