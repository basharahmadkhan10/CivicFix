import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  // Automatically set secure based on port
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const secure = port === 465; // true for 465, false for 587
  
  console.log(`📧 Sending email via ${process.env.EMAIL_HOST}:${port} (secure: ${secure})`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add timeout to prevent hanging
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
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
    console.error("❌ Email failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};
