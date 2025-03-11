require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
}));

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/webhook', async (req, res) => {
    const incomingMsg = req.body.Body;
    const from = req.body.From;
    let reply = '';

    if (incomingMsg.toLowerCase().includes('hola')) {
        reply = '¡Hola! ¿En qué puedo ayudarte hoy?\n1. Impresiones\n2. Libros escolares\n3. Preguntas frecuentes';
    } else if (incomingMsg === '1') {
        reply = 'Has seleccionado Impresiones. ¿Qué información necesitas?\n1. Precios\n2. Usos\n3. Encargar';
    } else if (incomingMsg === '2') {
        reply = 'Has seleccionado Libros escolares. ¿Cuántos libros necesitas? (Producción mínima 5 unidades)\n1. 5-10\n2. 11-20\n3. 21-50\n4. Más de 50';
    } else {
        const openaiResponse = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: incomingMsg,
            max_tokens: 150,
        });
        reply = openaiResponse.data.choices[0].text.trim();
    }

    twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        body: reply,
    });

    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
