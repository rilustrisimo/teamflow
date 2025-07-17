# 📧 Email Integration Setup Guide

## Overview
This guide will help you set up email functionality for your TeamFlow application. The email integration enables:
- User invitation emails
- Password reset emails
- Invoice sending
- Email confirmation for new users

## Prerequisites
- Supabase project with authentication enabled
- SMTP email service (Gmail, SendGrid, AWS SES, etc.)
- Supabase CLI installed (for Edge Functions deployment)

## Step 1: Choose Your Email Provider

### Option A: Gmail (Recommended for Development)
1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account Settings → Security → App passwords
   - Select "Mail" and generate a password
   - Use this password (not your regular password)

### Option B: SendGrid (Recommended for Production)
1. Create a SendGrid account
2. Create an API key with full access
3. Verify a sender email address
4. Use `apikey` as username and your API key as password

### Option C: AWS SES (Enterprise)
1. Set up AWS SES in your preferred region
2. Verify sender email/domain
3. Get SMTP credentials from AWS SES console

## Step 2: Configure Supabase Authentication

### 2.1 Enable Email Templates
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Enable and customize these templates:
   - **Confirm signup**
   - **Invite user**
   - **Reset password**

### 2.2 Set Custom Email Templates
Use the templates provided in `supabase/email-templates/`:
- `confirm-signup.html`
- `invite-user.html`
- `reset-password.html`

Copy the HTML content into your Supabase email templates.

### 2.3 Configure SMTP Settings
1. In Supabase Dashboard, go to **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. Toggle **Enable custom SMTP** to ON
4. Configure with your email provider settings:

```
SMTP Host: smtp.gmail.com (or your provider's SMTP host)
SMTP Port: 587
SMTP Username: your-email@gmail.com
SMTP Password: your-app-password
Sender Email: your-email@gmail.com
Sender Name: TeamFlow
```

## Step 3: Deploy Email Edge Function

### 3.1 Install Supabase CLI
```bash
# Install via npm
npm install -g supabase

# Or via brew (macOS)
brew install supabase

# Login to Supabase
supabase login
```

### 3.2 Link Your Project
```bash
# In your project directory
supabase link --project-ref your-project-id
```

### 3.3 Set Environment Variables for Edge Functions
```bash
# Set environment variables for the Edge Function
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USERNAME=your-email@gmail.com
supabase secrets set SMTP_PASSWORD=your-app-password
supabase secrets set FROM_EMAIL=your-email@gmail.com
supabase secrets set FROM_NAME=TeamFlow
```

### 3.4 Deploy the Edge Function
```bash
# Deploy the send-email function
supabase functions deploy send-email

# Verify deployment
supabase functions list
```

## Step 4: Test Email Functionality

### 4.1 Test User Invitation
1. Go to your app's admin panel
2. Try inviting a new user
3. Check that the invitation email is received

### 4.2 Test Password Reset
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check that reset email is received

### 4.3 Test Invoice Sending
1. Create an invoice
2. Try sending it to a client
3. Check that invoice email is received

## Step 5: Production Considerations

### 5.1 Domain Authentication
- Set up SPF, DKIM, and DMARC records
- Use a custom domain for from address
- Consider using a subdomain (e.g., noreply@yourdomain.com)

### 5.2 Email Deliverability
- Warm up your sending domain gradually
- Monitor bounce rates and spam complaints
- Use email validation for user inputs

### 5.3 Rate Limiting
- Implement rate limiting for email sending
- Add retry logic for failed sends
- Monitor email send quotas

## Common SMTP Providers Configuration

### Gmail
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-password (not regular password)
```

### SendGrid
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: your-sendgrid-api-key
```

### AWS SES
```
Host: email-smtp.us-east-1.amazonaws.com
Port: 587
Username: your-aws-ses-smtp-username
Password: your-aws-ses-smtp-password
```

### Mailgun
```
Host: smtp.mailgun.org
Port: 587
Username: your-mailgun-smtp-username
Password: your-mailgun-smtp-password
```

## Troubleshooting

### Common Issues
1. **Authentication failed**: Check username/password
2. **Connection timeout**: Verify SMTP host and port
3. **Emails going to spam**: Set up domain authentication
4. **Rate limiting**: Check your email provider's sending limits

### Testing Commands
```bash
# Test Edge Function locally
supabase functions serve send-email --env-file supabase/functions/.env

# Check function logs
supabase functions logs send-email

# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>",
    "text": "Test"
  }'
```

## Security Best Practices

1. **Use App Passwords**: Never use your main email password
2. **Rotate Credentials**: Regularly update SMTP passwords
3. **Monitor Usage**: Track email sending patterns
4. **Validate Inputs**: Sanitize email addresses and content
5. **Rate Limiting**: Prevent email spam/abuse

## Next Steps

After completing this setup:
1. ✅ Users can receive invitation emails
2. ✅ Password reset emails work
3. ✅ Invoice emails are sent to clients
4. ✅ Email confirmation for new signups

Your TeamFlow application is now ready for production with full email functionality!
