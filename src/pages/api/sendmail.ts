type EmailServiceConfig = {
    apiKey: string;
    fromEmail: string;
    fromName: string;
};

/**
 * Configure with your preferred email service provider.
 * Examples include SendGrid, Mailgun, AWS SES, etc.
 */
let emailConfig: EmailServiceConfig = {
    apiKey: import.meta.env.EMAIL_API_KEY || '',
    fromEmail: import.meta.env.FROM_EMAIL || 'downloads@yourdomain.com',
    fromName: import.meta.env.FROM_NAME || 'Your Company Name',
};

/**
 * Sends a download link email to the user
 */
export async function sendDownloadEmail(recipientEmail: string, downloadLink: string, productName: string) {
    // This is a placeholder function - implement with your email service
    try {
        // Example integration with a service like SendGrid
        // const sgMail = await import('@sendgrid/mail');
        // sgMail.setApiKey(emailConfig.apiKey);

        const emailContent = {
            to: recipientEmail,
            from: {
                email: emailConfig.fromEmail,
                name: emailConfig.fromName
            },
            subject: `Your Download Link for ${productName}`,
            text: `Thank you for your interest in ${productName}! Here's your download link: ${downloadLink}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your interest in ${productName}!</h2>
          <p>You can download your file using the link below:</p>
          <p style="margin: 25px 0;">
            <a href="${downloadLink}" 
               style="background-color: #4f46e5; color: white; padding: 12px 20px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Download Now
            </a>
          </p>
          <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${downloadLink}</p>
          <p>This download link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 14px;">
            You're receiving this email because you requested a download from our website.
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `
        };

        // Uncomment and complete when integrating with your email service
        // await sgMail.send(emailContent);

        console.log(`Email sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}