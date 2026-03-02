import sgMail from '@sendgrid/mail';

export const sendEmail = async ({ to, subject, text }) => {
  console.log(`Attempting to send email to: ${to}`);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: to,
    from: process.env.FROM_EMAIL, 
    subject: subject,
    text: text,
    html: text.replace(/\n/g, '<br>'), 
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return { success: true, messageId: response[0]?.headers['x-message-id'] };
  } catch (error) {
    console.error("SendGrid Error:", {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    throw error;
  }
};

