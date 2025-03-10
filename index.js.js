const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para interpretar JSON y datos de formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar credenciales de Google Sheets
if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.error("❌ ERROR: GOOGLE_SERVICE_ACCOUNT no está definido.");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
const auth = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Función para cargar los datos de la hoja de cálculo
async function loadSheet() {
  await doc.useServiceAccountAuth(auth);
  await doc.loadInfo();
  return doc.sheetsByIndex[0]; // Usar la primera hoja
}

// Webhook para recibir mensajes de WhatsApp
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.Body ? req.body.Body.toLowerCase().trim() : "";
    const from = req.body.From;

    if (!message) {
      return res.sendStatus(200);
    }

    console.log(`📩 Mensaje recibido: ${message} de ${from}`);

    let responseMessage = "No entendí tu mensaje. Usa una opción válida.";

    if (message.includes("hola") || message.includes("buenas")) {
      responseMessage = "¡Hola! ¿En qué podemos ayudarte?\n1️⃣ Impresiones 🖨️\n2️⃣ Libros Escolares 📚\n3️⃣ Preguntas Frecuentes ❓";
    } else if (message === "1") {
      responseMessage = "📄 Impresiones: ¿Qué necesitas?\n1️⃣ Precios\n2️⃣ Usos\n3️⃣ Encargar";
    } else if (message === "2") {
      responseMessage = "📚 Libros Escolares: ¿Cuántos libros necesitas?\n1️⃣ 5 a 10\n2️⃣ 11 a 20\n3️⃣ 21 a 50\n4️⃣ Más de 50";
    } else if (message === "3") {
      responseMessage = "❓ Preguntas Frecuentes:\n1️⃣ Medios de pago\n2️⃣ Ubicación\n3️⃣ Horarios de atención\n4️⃣ Página web\n5️⃣ Tiempos de producción";
    }

    console.log(`📤 Enviando respuesta: ${responseMessage}`);

    // Enviar respuesta
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`,
      new URLSearchParams({
        From: process.env.TWILIO_WHATSAPP_NUMBER,
        To: from,
        Body: responseMessage,
      }),
      {
        auth: {
          username: process.env.TWILIO_SID,
          password: process.env.TWILIO_AUTH_TOKEN,
        },
      }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en el webhook:", error);
    res.sendStatus(500);
  }
});

// Endpoint para verificar si el bot está activo
app.get("/", (req, res) => {
  res.send("🚀 El bot está activo y funcionando.");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});
