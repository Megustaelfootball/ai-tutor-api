require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const multer = require('multer');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Stripe (requires STRIPE_SECRET_KEY in .env)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mocked');

const app = express();
const port = process.env.PORT || 3000;

// Middleware for Stripe Webhooks (Raw body parsing required)
app.post('/api/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mocked');
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`[Seguridad] Pago validado y exitoso para Stripe Session: ${session.id}`);
        
        const taskId = session.client_reference_id;
        if (taskId && tasksDB[taskId]) {
            tasksDB[taskId].paid = true;
            console.log(`[Seguridad] Archivo completo DESBLOQUEADO para la tarea: ${taskId}`);
        }
    }

    res.json({received: true});
});

// Seguridad y Middlewares Globales
app.use(helmet()); // Cabeceras HTTP de seguridad
app.use(express.json({ limit: '5mb' })); // Prevenir ataques DoS con payloads masivos

// Restricción de CORS estricta para producción
const allowedOrigins = ['http://localhost:5173', 'https://tu-dominio-en-vercel.vercel.app'];
app.use(cors({
    origin: function(origin, callback){
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            return callback(new Error('La política CORS del servidor no permite acceso desde este origen.'), false);
        }
        return callback(null, true);
    }
}));

// Rate Limiting para evitar abusos o ataques de fuerza bruta a la API de IA
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Limitar cada IP a 50 peticiones por ventana
    message: "Demasiadas peticiones desde esta IP, la seguridad del sistema te ha bloqueado por 15 minutos."
});
app.use('/api/', apiLimiter);

// Mock In-Memory Database for Tasks
const tasksDB = {};

// Setup File Uploads for Tasks
const upload = multer({ dest: 'uploads/' });

// System Prompt Maestro para la IA (Paso 2)
const SYSTEM_PROMPT = `Eres un tutor experto y analista de élite trabajando para una plataforma de resolución de tareas premium.
Debes resolver la solicitud del usuario de forma completa, detallada y estructurada.
Tu respuesta debe contener:
1. Una breve introducción contextual.
2. El desarrollo paso a paso (fórmulas, código, o argumentos).
3. Una conclusión clara o resultado matemático final.
4. Formateado en Markdown limpio.
Nunca dejes pasos a medias. Actúa como el mejor en tu campo.`;

// 1. Endpoint: Procesar Tarea con "IA"
app.post('/api/tasks', upload.single('file'), async (req, res) => {
    // Tomamos todos los parámetros nuevos de las 3 dimensiones
    const { educationLevel, subject, specificTopic, taskText, teacherInstructions, outputFormat, outputLength } = req.body;
    
    // FILTRO ANTI-UNIVERSIDAD
    const universityKeywords = ['universidad', 'licenciatura', 'ingeniería', 'multivariado', 'termodinámica', 'tesis'];
    const textToCheck = (taskText + " " + specificTopic).toLowerCase();
    
    if (universityKeywords.some(keyword => textToCheck.includes(keyword)) || educationLevel === 'universidad') {
        return res.status(400).json({ 
            success: false, 
            error: "El servicio es exclusivo para nivel básico y medio superior. No procesamos tareas de nivel Universitario." 
        });
    }

    console.log(`[GPT-5] Preparando petición para: ${educationLevel} - ${subject}`);
    
    let aiResponseContent = "";
    
    try {
        // Motor de Instrucciones (Prompt Engineering Dinámico)
        const dynamicPrompt = `Rol: Actúa como un tutor experto en ${subject} para el nivel de ${educationLevel}.
Restricción: No utilices conceptos universitarios ni terminología excesivamente compleja. Utiliza lenguaje propio de un alumno de ${educationLevel}.
Estructura: Resuelve el tema "${specificTopic}". Asegúrate de responder estrictamente en el formato: "${outputFormat}".
Extensión solicitada: ${outputLength || 'La adecuada para responder completamente'}.
Instrucciones especiales del profesor: ${teacherInstructions || 'Ninguna particular.'}
`;

        const payload = {
            model: "gpt-5",
            messages: [
                { role: "system", content: dynamicPrompt },
                { role: "user", content: `Enunciado de la tarea:\n${taskText}` }
            ],
            stream: false
        };

        const response = await axios.post(
            process.env.AI_PLATFORM_API_URL, 
            payload, 
            {
                headers: {
                    "Authorization": `Bearer ${process.env.AI_PLATFORM_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 60000 
            }
        );

        aiResponseContent = response.data.choices[0].message.content;
    } catch (err) {
        console.error("Error al llamar a la IA (Abacus.ai):", err.response?.data || err.message);
        return res.status(500).json({ success: false, error: "Error de conexión con la IA. La tarea es demasiado larga o hubo un error temporal. Inténtalo de nuevo." });
    }
    
    // Paso 4: Inteligencia de Previsualización (Muestra Gratis)
    const charsToShow = Math.max(150, Math.floor(aiResponseContent.length * 0.40));
    const previewText = aiResponseContent.substring(0, charsToShow) + "\n\n...";
    
    const taskId = 'task_' + Date.now();
    tasksDB[taskId] = {
        id: taskId,
        preview: previewText,
        fullResult: aiResponseContent,
        paid: false
    };

    res.json({ success: true, taskId: taskId, preview: previewText });
});

// 2. Endpoint: Generar Sesión de Pago en Stripe ($50 MXN)
app.post('/api/checkout', async (req, res) => {
    const { taskId } = req.body;

    if (!tasksDB[taskId]) {
        return res.status(404).json({ error: "Tarea no encontrada" });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'oxxo'],
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: 'Descarga de Solución Completa (Nivel Medio)',
                            description: 'Desbloquea instantáneamente el archivo con tu solución.',
                        },
                        unit_amount: 5000, // $50.00 MXN en centavos
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            client_reference_id: taskId,
            success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}&task_id=${taskId}`,
            cancel_url: `http://localhost:5173/canceled?task_id=${taskId}`,
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Endpoint: Obtener resultado completo (Seguro)
app.get('/api/tasks/:taskId/download', (req, res) => {
    const { taskId } = req.params;
    const task = tasksDB[taskId];

    if (!task) return res.status(404).json({ error: "Tarea no encontrada en los servidores puros." });

    // [Seguridad Crítica] Validación imperativa de estado de pago (Evita BOLA / IDOR)
    if (!task.paid && process.env.NODE_ENV !== 'development') {
        // En producción siempre bloqueamos las tareas no pagadas explícitamente.
        // Como estamos simulando pruebas locas si quieres probar, cambiamos el flag, pero por default siempre validamos:
        console.log(`[Intento Bloqueado] Se intentó descargar la tarea ${taskId} sin pagar.`);
        return res.status(403).json({ error: "Acceso denegado. Pago no completado en Stripe o procesamiento en progreso." });
    }

    res.json({
        success: true,
        fullResult: task.fullResult
    });
});

app.listen(port, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${port}`);
});
