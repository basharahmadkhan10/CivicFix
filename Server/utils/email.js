import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  console.log(`📧 Attempting to send email to: ${to}`);
  
  // CORRECTED: Use port 465 for SSL (secure: true)
  // OR port 587 for TLS (secure: false)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Changed from 443 to 465
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Timeout settings
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: true,
    logger: true,
    // Optional: Add TLS options
    tls: {
      // Do not fail on invalid certs (for testing only)
      rejectUnauthorized: false
    }
  });

  try {
    // First verify connection configuration
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    const info = await transporter.sendMail({
      from: `"CivicFix" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      // Add HTML version if needed
      // html: `<p>${text}</p>`,
    });
    
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    console.log(`📬 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (error) {
    console.error("❌ Email error:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    
    // Throw error so we know it failed
    throw error;
  }
};
