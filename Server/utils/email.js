import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  console.log(`📧 Attempting to send email to: ${to}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add timeouts to prevent hanging
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
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
      command: error.command
    });
    
    // Don't throw - just log and continue
    // This way login doesn't fail if email fails
    return { error: true, message: error.message };
  }
};
