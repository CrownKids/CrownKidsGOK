const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar credenciales de Google Sheets
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
const auth = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function loadSheet() {
    await doc.useServiceAccountAuth(auth);
    await doc.loadInfo();
    return doc.sheetsByIndex[0];
}

const userStates = {};

app.post('/webhook', async (req, res) => {
    try {
        const message = req.body.Body ? req.body.Body.toLowerCase().trim() : "";
        const from = req.body.From;

        if (!message) return res.sendStatus(200);

        console.log(`📩 Mensaje recibido: ${message} de ${from}`);

        let responseMessage = "";

        if (!userStates[from]) {
            userStates[from] = { step: "inicio" };
        }

        const userState = userStates[from];

        switch (userState.step) {
            case "inicio":
                responseMessage = "¡Hola! ¿En qué podemos ayudarte?\n1️⃣ Impresiones 🖨️\n2️⃣ Libros Escolares 📚\n3️⃣ Preguntas Frecuentes ❓";
                userState.step = "esperando_categoria";
                break;

            case "esperando_categoria":
                if (message === "1") {
                    responseMessage = "¿Qué necesitas saber?\n1️⃣ Precios 💰\n2️⃣ Usos 📜\n3️⃣ Encargar 🛒";
                    userState.step = "impresiones";
                } else if (message === "2") {
                    responseMessage = "📚 ¿Cuántos libros necesitas? (Mínimo 5 unidades)\n1️⃣ 5-10\n2️⃣ 11-20\n3️⃣ 21-50\n4️⃣ +50";
                    userState.step = "libros_cantidad";
                } else if (message === "3") {
                    responseMessage = "Preguntas Frecuentes:\n1️⃣ Medios de pago 💳\n2️⃣ Ubicación 📍\n3️⃣ Horarios de atención ⏰\n4️⃣ Página web 🌐\n5️⃣ Tiempos de producción ⚙️";
                    userState.step = "preguntas_frecuentes";
                } else {
                    responseMessage = "Por favor, elige una opción válida (1, 2 o 3).";
                }
                break;

            case "impresiones":
                if (message === "1") {
                    responseMessage = "Estos son nuestros precios actualizados:\nObra: $40\nIlustración 150: $30\nOpalina: $50";
                } else if (message === "2") {
                    responseMessage = "Obra: Papel común, ideal para libros.\nIlustración 150g: Papel brilloso, similar a un folleto.";
                } else if (message === "3") {
                    responseMessage = "Para hacer un encargo, envíanos los siguientes datos:\nNombre:\nTipo y gramaje del papel:\nCantidad de copias:\nSimple o doble cara:\nObservaciones:\nAdemás, envía el archivo a imprimir.";
                    userState.step = "impresion_datos";
                } else {
                    responseMessage = "Por favor, elige una opción válida (1, 2 o 3).";
                }
                break;

            case "libros_cantidad":
                responseMessage = "📖 ¿En qué idioma necesitas los libros?\n1️⃣ Español 🇪🇸\n2️⃣ Inglés 🇬🇧\n3️⃣ Otro 🌍";
                userState.step = "libros_idioma";
                break;

            case "libros_idioma":
                responseMessage = "📚 ¿Qué editorial buscas? (Ejemplo: Santillana, Kapelluz)";
                userState.step = "libros_editorial";
                break;

            case "libros_editorial":
                responseMessage = "📖 ¿Qué materia buscas?\n1️⃣ Matemática\n2️⃣ Lengua\n3️⃣ Cs. Naturales\n4️⃣ Cs. Sociales";
                userState.step = "libros_materia";
                break;

            case "libros_materia":
                responseMessage = "Estos son los libros disponibles según tus criterios.\n1️⃣ Libro A ($500)\n2️⃣ Libro B ($300)\n3️⃣ Libro C ($200)\n4️⃣ El libro que busco no está en la lista.";
                userState.step = "libros_seleccion";
                break;

            case "preguntas_frecuentes":
                const respuestasFAQ = {
                    "1": "Aceptamos todos los medios de pago: MP, tarjeta de crédito/débito y transferencia. Alias: Grafok",
                    "2": "📍Estamos en Suipacha 1035, CABA",
                    "3": "⏰ Nuestro horario de atención es de 6:00 a 22:00 hs",
                    "4": "🌐 Nuestra web es www.graficaok.com",
                    "5": "⚙️ Hacemos todo lo más rápido posible. Depende de la cantidad." 
                };
                responseMessage = respuestasFAQ[message] || "Por favor, elige una opción válida (1-5).";
                break;

            default:
                responseMessage = "No entendí tu mensaje. Por favor, usa una opción válida.";
        }

        await axios.post(process.env.TWILIO_API_URL, new URLSearchParams({
            From: process.env.TWILIO_WHATSAPP_NUMBER,
            To: from,
            Body: responseMessage
        }), {
            auth: {
                username: process.env.TWILIO_SID,
                password: process.env.TWILIO_AUTH_TOKEN
            }
        });

        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error en el webhook:", error);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});
