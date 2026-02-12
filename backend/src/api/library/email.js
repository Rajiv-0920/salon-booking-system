import emailjs from '@emailjs/nodejs';

const sendEmail = async (options) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  const templateParams = {
    email: options.email,
    subject: options.subject,
    message: options.message,
    reset_url: options.resetURL, // You can pass variables to your EmailJS template
  };

  return await emailjs.send(serviceId, templateId, templateParams, {
    publicKey,
    privateKey,
  });
};

export default sendEmail;
