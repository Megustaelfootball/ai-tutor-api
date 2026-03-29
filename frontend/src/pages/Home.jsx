import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import './Home.css';

export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Estados para Mensajes Rotativos
  const loadingMessages = [
    "Analizando los requerimientos...",
    "Revisando el material de origen...",
    "Conectando con el Motor Tutor IA...",
    "Resolviendo paso a paso...",
    "Ajustando el tono al nivel educativo...",
    "Preparando tu archivo final..."
  ];
  const [loadingMsgIdx, setLoadingMsgIdx] = React.useState(0);

  React.useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Form Data state
  const [formData, setFormData] = useState({
      // A. Clasificación Académica
      educationLevel: '',
      subject: '',
      specificTopic: '',
      // B. Material
      taskText: '',
      teacherInstructions: '',
      // file will be handled via a ref or separate state if doing multipart, but for now we focus on text.
      // C. Output
      outputLength: '',
      outputFormat: ''
  });

  const handleChange = (e) => {
      setFormData({...formData, [e.target.name]: e.target.value});
  };

  const nextStep = () => {
    // Validaciones
    if (step === 1) {
      if (!formData.educationLevel || !formData.subject || !formData.specificTopic) {
        alert("Por favor completa todos los campos académicos.");
        return;
      }
      if (formData.educationLevel === "universidad") {
         alert("Lo sentimos. El servicio está optimizado exclusivamente para el nivel básico y medio superior. No damos soporte a nivel Universitario.");
         return;
      }
    }
    if (step === 2 && !formData.taskText) {
       alert("Por favor proporciona el enunciado o texto de la tarea.");
       return;
    }
    setStep(step + 1);
  };
  
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
       // Utilizamos la variable VITE_API_URL que Vercel cargará
       const apiBaseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
       const res = await axios.post(`${apiBaseURL}/api/tasks`, formData, {
           headers: { 'Content-Type': 'application/json' }
       });
       
       if (res.data.success) {
           navigate(`/preview/${res.data.taskId}`, { state: { preview: res.data.preview } });
       } else {
           alert(res.data.error || "Error desconocido");
           setLoading(false);
       }
    } catch (err) {
       console.error(err);
       alert(err.response?.data?.error || "Error al procesar la tarea. Revisa tu conexión o intenta de nuevo.");
       setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{position: 'relative', minHeight: '500px'}}>
       <div className="wizard-progress-bar">
          <div className="wizard-progress-fill" style={{width: `${(step/3)*100}%`}}></div>
       </div>
       
       <h1 className="title">
         {step === 1 && '1. Clasificación Académica'}
         {step === 2 && '2. Material de Origen'}
         {step === 3 && '3. Parámetros Finales'}
       </h1>
       <p className="subtitle">
         {step === 1 && 'Ayúdanos a perfilar la tarea para darte una solución exacta.'}
         {step === 2 && 'Sube tu problema o pégalo directamente aquí.'}
         {step === 3 && '¿Cómo quieres que te entreguemos el resultado?'}
       </p>
       
       <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
          
          {/* STEP 1: CLASIFICACIÓN */}
          {step === 1 && (
             <div className="step-content fade-in">
                <div className="form-group">
                  <label>Nivel Educativo</label>
                  <select name="educationLevel" value={formData.educationLevel} onChange={handleChange} className="input-field" required>
                     <option value="">Selecciona el nivel</option>
                     <option value="secundaria">Secundaria</option>
                     <option value="bachillerato">Preparatoria / Bachillerato</option>
                     <option value="universidad" disabled>Universidad (No soportado)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Materia</label>
                  <select name="subject" value={formData.subject} onChange={handleChange} className="input-field" required>
                     <option value="">Selecciona la materia</option>
                     <option value="Matemáticas">Matemáticas</option>
                     <option value="Física">Física</option>
                     <option value="Química">Química</option>
                     <option value="Biología">Biología</option>
                     <option value="Historia">Historia</option>
                     <option value="Literatura">Literatura</option>
                     <option value="Otra">Otra...</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tema Específico</label>
                  <input type="text" name="specificTopic" value={formData.specificTopic} onChange={handleChange} className="input-field" placeholder="Ej: Ecuaciones de 2do grado, Revolución Francesa" required />
                </div>
                
                <button type="button" onClick={nextStep} className="btn-primary" style={{marginTop:'1.5rem'}}>
                  Siguiente Paso <ArrowRight size={20} />
                </button>
             </div>
          )}

          {/* STEP 2: MATERIAL */}
          {step === 2 && (
             <div className="step-content fade-in">
                <div className="form-group">
                  <label>Enunciado de la Tarea</label>
                  <textarea 
                     name="taskText"
                     value={formData.taskText} 
                     onChange={handleChange} 
                     placeholder="Escribe o pega aquí el problema matemático o la descripción del ensayo..."
                     required
                     style={{minHeight: '130px'}}
                  />
                </div>

                <div className="form-group">
                  <label>Instrucciones del Profesor (Opcional)</label>
                  <textarea 
                     name="teacherInstructions"
                     value={formData.teacherInstructions} 
                     onChange={handleChange} 
                     placeholder="Ej: Quiere que usemos el método de sustitución, no de igualación..."
                     style={{minHeight: '80px'}}
                  />
                </div>
                
                <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem'}}>
                    <button type="button" className="btn-secondary" onClick={prevStep} style={{flex: 0.4}}>
                      <ArrowLeft size={20} /> Atrás
                    </button>
                    <button type="button" onClick={nextStep} className="btn-primary" style={{flex: 1}}>
                      Casi listo <ArrowRight size={20} />
                    </button>
                </div>
             </div>
          )}

          {/* STEP 3: OUTPUT */}
          {step === 3 && (
             <div className="step-content fade-in">
                
                <div className="form-group">
                  <label>Formato de Entrega</label>
                  <select name="outputFormat" value={formData.outputFormat} onChange={handleChange} className="input-field" required>
                     <option value="">Selecciona un formato</option>
                     <option value="Procedimiento matemático paso a paso">Procedimiento matemático paso a paso</option>
                     <option value="Ensayo estructurado">Ensayo estructurado</option>
                     <option value="Cuestionario resuelto">Cuestionario resuelto</option>
                     <option value="Mapa conceptual en texto">Mapa conceptual en texto</option>
                     <option value="Resumen de puntos clave">Resumen de puntos clave</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Extensión (Opcional)</label>
                  <input type="text" name="outputLength" value={formData.outputLength} onChange={handleChange} className="input-field" placeholder="Ej: 500 palabras, 2 cuartillas, Corto..." />
                </div>
                
                <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem'}}>
                    <button type="button" className="btn-secondary" onClick={prevStep} disabled={loading} style={{flex: 0.4}}>
                      <ArrowLeft size={20} /> Atrás
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading} style={{flex: 1}}>
                      {loading ? (
                         <div style={{display:'flex', alignItems: 'center', gap: '0.8rem'}}>
                            <div className="loader"></div>
                            <span>{loadingMessages[loadingMsgIdx]}</span>
                         </div>
                      ) : <><Sparkles size={20} /> Procesar Tarea ($50 MXN)</>}
                    </button>
                </div>
             </div>
          )}
       </form>
    </div>
  )
}
