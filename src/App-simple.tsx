const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '2rem', marginBottom: '1rem' }}>
        🎉 Front& V1 - Test Page
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        If you can see this, React is working! 
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>✅ Next Steps:</h2>
        <ul>
          <li>✅ React is rendering</li>
          <li>✅ TypeScript is working</li>
          <li>🔄 Now testing complex components...</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleApp; 