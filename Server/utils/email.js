import sgMail from '@sendgrid/mail';

// Initialize with SendGrid API key (you'll add this to env)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async ({ to, subject, text }) => {
  console.log(`📧 Attempting to send email to: ${to} via SendGrid API`);

  const msg = {
    to: to,
    from: process.env.EMAIL_USER, // Using your existing EMAIL_USER
    subject: subject,
    text: text,
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ SendGrid error:", {
      message: error.message,
      response: error.response?.body
    });
    
    // Don't throw - your login flow already works
    return { error: true };
  }
};
