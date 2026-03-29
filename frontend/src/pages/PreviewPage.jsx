import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Lock, CreditCard } from 'lucide-react';

export default function PreviewPage() {
  const { taskId } = useParams();
  const location = useLocation();
  const [preview, setPreview] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    if (location.state && location.state.preview) {
        setPreview(location.state.preview);
    } else {
        setPreview("Cargando vista previa del documento...\n\nPor favor espera.");
    }
  }, [taskId, location]);

  const handlePayment = async () => {
    setLoadingPayment(true);
    try {
        const res = await axios.post('http://localhost:3000/api/checkout', { taskId });
        window.location.href = res.data.url; // Redirect to Stripe
    } catch (err) {
        alert("Error al iniciar pago");
        console.error(err);
    } finally {
        setLoadingPayment(false);
    }
  }

  return (
    <div className="glass-card">
       <h1 className="title">¡Solución Generada!</h1>
       <p className="subtitle">Hemos resuelto tu tarea. Aquí tienes un vistazo a la solución:</p>
       
       <div className="preview-container">
          <div className="preview-content">
             {preview}
          </div>
          <div className="fade-overlay">
             <div className="lock-icon"><Lock color="#fff" size={32} /></div>
             <div className="price-tag">$50.00 MXN</div>
             <button className="btn-primary" style={{width: '80%', marginBottom: '1rem'}} onClick={handlePayment} disabled={loadingPayment}>
                {loadingPayment ? <div className="loader" /> : <><CreditCard size={20} /> Pagar y Descargar Solución Completa</>}
             </button>
          </div>
       </div>
    </div>
  )
}
