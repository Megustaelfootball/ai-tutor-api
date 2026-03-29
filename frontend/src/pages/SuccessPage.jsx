import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Download } from 'lucide-react';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('task_id');
  const [result, setResult] = useState('Cargando...');

  useEffect(() => {
    if(taskId) {
        const apiBaseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        axios.get(`${apiBaseURL}/api/tasks/${taskId}/download`)
             .then(res => setResult(res.data.fullResult))
             .catch(err => setResult("Error obteniendo el resultado completo."));
    }
  }, [taskId]);

  return (
    <div className="glass-card">
       <div className="alert-success">
          <CheckCircle size={40} style={{marginBottom: '1rem'}} />
          <h2>¡Pago Exitoso!</h2>
          <p>Tu solución completa ya está disponible.</p>
       </div>
       
       <div className="result-card">
          {result}
       </div>
       
       <button className="btn-primary" style={{marginTop: '2rem'}} onClick={() => window.print()}>
          <Download size={20} /> Guardar como PDF
       </button>
    </div>
  )
}
