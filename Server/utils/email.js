import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  console.log(`📧 Attempting to send email to: ${to}`);
  
  // Use SSL port 465 with secure:true
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 443,
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add timeout and debug
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: true, // Add this for more logs
    logger: true,
  });

  try {
    const info = await transporter.sendMail({
      from: `"CivicFix" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Email error:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    // Throw error so we know it failed
    throw error;
  }
};
