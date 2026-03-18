# Supabase Project Migration Guide

## Current Project Info
- **Old Project Ref**: djmhjkwctuemwrlbviap
- **Old URL**: https://djmhjkwctuemwrlbviap.supabase.co
- **Status**: Paused (since Jun 24, 2024)

## Migration Checklist

### 1. Create New Project ✓
- [ ] Created new project on Supabase Dashboard
- [ ] Saved new project URL
- [ ] Saved new Anon Key
- [ ] Saved new Service Role Key
- [ ] Saved new Database Password

### 2. Download Backups from Old Project ✓
- [ ] Downloaded database backup (.sql or .backup file)
- [ ] Downloaded storage objects backup

### 3. Restore Database ✓
```bash
# Unzip backup if needed (must end with .backup or .sql)
gunzip backup_name.sql.gz  # if gzipped

# Get connection string from new project (Settings > Database > Connection string)
# Use Session pooler by default:
# postgresql://postgres.[NEW-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Restore database
psql -d "postgresql://postgres.[NEW-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -f ./backup_name.sql
```

**Expected Errors**: You'll see errors like "object already exists" - this is normal and expected on new Supabase projects.

### 4. Migrate Storage Objects ✓
Use the [Google Colab script](https://colab.research.google.com/github/PLyn/supabase-storage-migrate/blob/main/Supabase_Storage_migration.ipynb):
- Upload old project storage backup
- Provide new project credentials
- Run migration script

### 5. Update Project Configuration ✓
Update `.env` file with new project credentials:
```env
VITE_SUPABASE_URL=https://[NEW-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[NEW-ANON-KEY]
VITE_SUPABASE_SERVICE_ROLE_KEY=[NEW-SERVICE-ROLE-KEY]
SUPABASE_DB_PASSWORD=[NEW-DB-PASSWORD]
```

### 6. Re-deploy Edge Functions ✓
```bash
# Login to Supabase CLI
npx supabase login

# Link to new project
npx supabase link --project-ref [NEW-REF]

# Deploy edge function
npx supabase functions deploy send-email
```

### 7. Manual Configuration (Not in Database) ✓
These settings need to be manually configured in the new project dashboard:

#### Auth Settings:
- [ ] Configure email templates (confirm-signup, invite-user, reset-password)
- [ ] Set Site URL: `http://localhost:5173` (or production URL)
- [ ] Set Redirect URLs
- [ ] Configure external auth providers (if any)

#### Database Extensions (if used):
- [ ] Enable required extensions in Dashboard > Database > Extensions

#### Realtime Settings (if used):
- [ ] Configure Realtime settings

## Files in This Project

### Edge Functions:
- `supabase/functions/send-email/` - Email sending function

### Email Templates:
- `supabase/email-templates/confirm-signup.html`
- `supabase/email-templates/invite-user.html`
- `supabase/email-templates/reset-password.html`

### Database Migrations:
- 52 migration files in `supabase/migrations/`
- These will be restored with the database backup

## Troubleshooting

### "psql: error: connection failed: received invalid response"
- Use psql version 16 or higher
- `brew install postgresql@16` (macOS)

### "Wrong password" error
- Wait a few minutes after resetting password
- Password changes can take time to propagate

### Edge function environment variables
After deploying functions, set secrets:
```bash
npx supabase secrets set SMTP_HOST=smtp.hostinger.com
npx supabase secrets set SMTP_PORT=465
npx supabase secrets set SMTP_USERNAME=teamflow@eyorsolutions.com
npx supabase secrets set SMTP_PASSWORD='r2ZdGNRs@#Vqs3E'
npx supabase secrets set FROM_EMAIL=teamflow@eyorsolutions.com
npx supabase secrets set FROM_NAME='Team Flow'
```

## Post-Migration Verification

- [ ] Test user authentication
- [ ] Verify database tables and data
- [ ] Check storage files are accessible
- [ ] Test edge functions
- [ ] Verify email sending works
- [ ] Test all application features

## Support
If you encounter issues, contact [Supabase Support](https://supabase.com/support)
