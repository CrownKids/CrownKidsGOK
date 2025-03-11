require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/webhook', async (req, res) => {
    const incomingMsg = req.body.Body.toLowerCase();
    const from = req.body.From;
    let reply = '';

    if (incomingMsg.includes('hola')) {
        reply = '¡Hola! ¿En qué puedo ayudarte hoy?\n1. Impresiones\n2. Libros escolares\n3. Preguntas frecuentes';
    } else if (incomingMsg === '1') {
        reply = 'Has seleccionado Impresiones. ¿Qué información necesitas?\n1. Precios\n2. Usos\n3. Encargar';
    } else if (incomingMsg === '2') {
        reply = 'Has seleccionado Libros escolares. ¿Cuántos libros necesitas? (Mínimo 5 unidades)\n1. 5-10\n2. 11-20\n3. 21-50\n4. Más de 50';
    } else {
        reply = 'No entendí tu mensaje. Por favor, elige una opción del menú.';
    }

    await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        body: reply,
    });

    res.sendStatus(200);
});

// Keep-alive para evitar que Railway cierre el servidor
setInterval(() => {
    console.log("🔄 Servidor sigue corriendo en Railway...");
}, 60 * 1000); // Ejecuta un mensaje cada 1 minuto

// Ruta de prueba para verificar si el servidor está activo
app.get('/', (req, res) => {
    res.send('✅ Servidor activo');
});

app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${port}`);
});
