# Email Configuration Setup

To enable email functionality in SkillSwapper, you need to configure the following environment variables in your `.env` file:

## Required Environment Variables

```env
# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

## Alternative Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
```

## Testing Email Configuration

The email service will automatically test the connection when the server starts. Check the console logs for any configuration errors.

## Email Templates

The system sends two types of emails when a connection request is accepted:

1. **To the requester**: Notification that their request was accepted, including the accepter's email
2. **To the accepter**: Confirmation of the new connection, including the requester's email

Both emails include:
- Contact information (name and email)
- Matching skills details
- Next steps for collaboration
- Links back to the SkillSwapper platform







