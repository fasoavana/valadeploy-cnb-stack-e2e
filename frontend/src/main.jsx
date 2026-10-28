import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const apiBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('Vérification en cours…');
  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/health`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`API HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => { if (active) { setData(payload); setError(''); } })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);
  return <main>
    <h1>ValaDeploy — Stack CNB</h1>
    <p>Frontend <strong>React/Vite</strong> · Backend <strong>FastAPI</strong> · DB <strong>PostgreSQL</strong></p>
    <p className={data?.database === 'connected' ? 'ok' : 'wait'}>
      {data?.database === 'connected' ? 'STACK_CNB_E2E_OK' : error || 'Connexion en attente'}
    </p>
    <pre>{JSON.stringify(data || { status: 'waiting' }, null, 2)}</pre>
    <small>API : {apiBase}</small>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
