// Importación de paquetes
const express = require("express");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const path = require("path");
const nodemailer = require("nodemailer");
const multer = require("multer"); // Añadido para el manejo de archivos

// Configuración de parámetros
const config = require("./config");

// Inicialización de la aplicación Express
const app = express();

// Configuración del motor de plantillas (Handlebars)
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// Middleware para procesar datos de formularios (URL-encoded y JSON)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración de la carpeta estática (para CSS, imágenes, etc.)
app.use("/public", express.static(path.join(__dirname, "public")));

// Configuración de multer para almacenar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // La carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renombrar el archivo con un timestamp
  },
});

const upload = multer({ storage: storage }); // Usar multer con la configuración definida

// Notificación de inicio del servidor
app.listen(3000, () => console.log("Server Started on port 3000..."));

// Ruta para la página principal
app.get("/", (req, res) => {
  res.render(config.theme); // Renderiza la plantilla del tema configurado
});

// Ruta para manejar el envío del formulario con la carga de la imagen
app.post("/send", upload.single("photo_references"), (req, res) => {
  // Plantilla del correo que se enviará al administrador
  const output = `
    <p>You have a message</p>
    <h3>Contact Details</h3>
    <p>Name: ${req.body.name}</p>
    <p>Phone: ${req.body.phone}</p>
    <p>Email: ${req.body.email}</p>
    <p>Product Category: ${req.body.product_category}</p>
    <p>Product Reference: ${req.body.product_reference}</p>
    <p>Photo Reference :</p>
    <img src="cid:photo_references" alt="Photo Reference" style="width:100%; max-width:300px; height:auto;">
    <p>Quantity: ${req.body.quantity}</p>
    <p>Has Supplier: ${req.body.has_supplier}</p>
    <p>City: ${req.body.city}</p>
    <h3>Message</h3>
    <p>${req.body.message}</p>
  `;

  // Plantilla del correo de confirmación que se enviará al cliente
  const clientConfirmation = `
    <p>Gracias Sr(a). ${req.body.name},</p>
    <p>Hemos recibido su correo con éxito. Con los siguientes datos:</p>
    <h3>Detalles del contacto:</h3>
    <p><strong>Nombre:</strong> ${req.body.name}</p>
    <p><strong>Teléfono:</strong> ${req.body.phone}</p>
    <p><strong>Correo Electrónico:</strong> ${req.body.email}</p>
    <p><strong>Categoría del Producto:</strong> ${req.body.product_category}</p>
    <p><strong>Referencia del Producto:</strong> ${req.body.product_reference}</p>
    <p><strong>Foto Referencia:</strong></p>
    <img src="cid:photo_references" alt="Photo Reference" style="width:100%; max-width:300px; height:auto;">
    <p><strong>Cantidad:</strong> ${req.body.quantity}</p>
    <p><strong>Proveedor:</strong> ${req.body.has_supplier}</p>
    <p><strong>Ciudad:</strong> ${req.body.city}</p>
    <h3>Mensaje:</h3>
    <p>${req.body.message}</p>
    <p>Nos pondremos en contacto con usted pronto.</p>
  `;

  // Alerta en caso de éxito
  const successAlert = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            El mensaje ha sido enviado
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;

  // Alerta en caso de error
  const failAlert = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            No se pudo enviar el mensaje. Actualice esta página.
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;

  // Crear objeto de transporte reusable con el servidor SMTP
  let transporter = nodemailer.createTransport({
    service: "gmail", // Usamos Gmail como servicio
    auth: {
      user: config.user, // Tu correo de Gmail
      pass: config.pass, // La contraseña de la aplicación
    },
    tls: {
      rejectUnauthorized: false, // Permite conexiones no autorizadas (necesario para algunos casos)
    },
  });

  // Configuración del correo que será enviado al administrador
  let mailOptionsAdmin = {
    from: config.from, // Remitente
    to: config.to, // Destinatario
    subject: config.subject, // Asunto del correo
    html: output, // Contenido HTML del correo
    attachments: [
      {
        filename: req.file ? req.file.originalname : "no-image.jpg", // Nombre del archivo adjunto
        path: req.file ? req.file.path : "", // Path del archivo cargado
        cid: "photo_references", // ID para referenciar la imagen en el correo
      },
    ],
  };

  // Configuración del correo que será enviado al cliente
  let mailOptionsClient = {
    from: config.from, // Remitente
    to: req.body.email, // Correo del cliente
    subject: "Confirmación de contacto", // Asunto del correo
    html: clientConfirmation, // Contenido HTML del correo
    attachments: [
      {
        filename: req.file ? req.file.originalname : "no-image.jpg", // Nombre del archivo adjunto
        path: req.file ? req.file.path : "", // Path del archivo cargado
        cid: "photo_references", // ID para referenciar la imagen en el correo
      },
    ],
  };

  // Enviar el correo al administrador
  transporter.sendMail(mailOptionsAdmin, (error, info) => {
    if (error) {
      console.log(error); // Log para depurar el error
      return res.render(config.theme, { msg: failAlert }); // Enviar la alerta de error
    }

    // Enviar el correo de confirmación al cliente
    transporter.sendMail(mailOptionsClient, (error, info) => {
      if (error) {
        console.log(error); // Log para depurar el error
        return res.render(config.theme, { msg: failAlert }); // Enviar la alerta de error
      }

      // Enviar la alerta de éxito
      res.render(config.theme, { msg: successAlert });
    });
  });
});
