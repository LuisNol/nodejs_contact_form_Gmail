module.exports = {
    // Tema de la plantilla que se usará
    theme: "lightBlue", // Cambia este valor según tu plantilla de Handlebars

    // Configuración del servidor SMTP
    service: 'gmail', // Usar el servicio de Gmail directamente
    user: "jook.lat.jook@gmail.com", // Tu correo de Gmail
    pass: "dhty ddrx bmyt lnel", // La contraseña de la aplicación generada

    // Correo del remitente y destinatario
    from: '"Contact Me" <jook.lat.jook@gmail.com>', // El correo desde el cual se enviarán los mensajes
    to: 'jook.lat.jook@gmail.com', // El correo al que se enviarán los mensajes (puedes usar varios correos separados por coma)
    subject: 'Contact Us', // Asunto del correo

    // Puedes añadir más configuraciones si es necesario
};
