# Email Configuration Guide

This guide explains how to configure email functionality for sending warranty case details to customers.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# SMTP Configuration
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@example.com
```

## Configuration Details

### SMTP_HOST

The hostname of your SMTP server.

- **Example for Gmail**: `smtp.gmail.com`
- **Example for Outlook**: `smtp-mail.outlook.com`
- **Example for custom host**: `mail.yourdomain.com`

### SMTP_PORT

The port number for your SMTP server.

- **587**: Standard port for TLS/STARTTLS (recommended)
- **465**: Port for SSL
- **25**: Standard SMTP port (often blocked by ISPs)

### SMTP_SECURE

Whether to use SSL/TLS.

- **false**: Use STARTTLS (port 587)
- **true**: Use SSL (port 465)

### SMTP_USER

Your SMTP authentication username (usually your email address).

### SMTP_PASS

Your SMTP authentication password.

- For Gmail: Use an [App Password](https://support.google.com/accounts/answer/185833)
- For Outlook: Use your regular password or app password
- For custom servers: Use your email password

### SMTP_FROM

The "from" email address that appears in sent emails.

- If not set, defaults to SMTP_USER

## Example Configurations

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### Outlook/Office365

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
```

### Custom Domain (e.g., cPanel, Plesk)

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

## Features

### Email Functionality

The email feature automatically:

1. Generates a PDF of the warranty case details
2. Attaches the PDF to the email
3. Sends a formatted email to the customer with:
   - Service number
   - Customer name
   - Current status
   - Received items
   - Issues reported
   - Solutions provided (if any)

### Button Visibility

- The "Send Email" button only appears when a customer email address is available
- The button is disabled while sending to prevent duplicate emails
- Success/error messages are shown via toast notifications

## Testing

To test the email configuration:

1. Set up your environment variables
2. Restart your development server
3. Open a warranty case with a customer email
4. Click the "Send Email" button
5. Check your email inbox for the test email

## Troubleshooting

### "Email configuration is missing" error

- Verify all required environment variables are set in `.env.local`
- Restart your development server after adding variables

### "Authentication failed" error

- Double-check your SMTP_USER and SMTP_PASS
- For Gmail, ensure you're using an App Password, not your regular password
- Verify that "Less secure app access" is enabled (if applicable)

### "Connection refused" error

- Check that SMTP_HOST and SMTP_PORT are correct
- Verify your firewall isn't blocking the SMTP port
- Try using port 465 with SMTP_SECURE=true

### Emails not received

- Check spam/junk folder
- Verify the recipient email address is correct
- Check your SMTP provider's sending limits
- Review server logs for error messages

## Security Notes

1. Never commit `.env.local` to version control
2. Use App Passwords instead of regular passwords when possible
3. Consider using environment-specific email addresses (e.g., dev@, staging@, prod@)
4. Regularly rotate SMTP passwords
5. Monitor email sending logs for suspicious activity

## Production Deployment

For production environments:

1. Use environment variables specific to your hosting platform:

   - **Vercel**: Add variables in Project Settings → Environment Variables
   - **Netlify**: Add variables in Site Settings → Environment Variables
   - **AWS**: Use AWS Secrets Manager or Parameter Store
   - **Docker**: Pass variables via docker-compose.yml or Kubernetes secrets

2. Consider using a dedicated email service:

   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark

3. Implement rate limiting to prevent abuse
4. Add email delivery monitoring and alerts
5. Set up proper SPF, DKIM, and DMARC records for your domain
