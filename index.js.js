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

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
