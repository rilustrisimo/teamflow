# User Invitation and Creation System

## Overview

The TeamFlow SaaS application now has a comprehensive user invitation and creation system that properly handles:

1. **Admin Signup**: Company admins can create their own companies
2. **User Invitation**: Admins can invite users to join their company
3. **Direct User Creation**: Admins can create users directly without email invitation
4. **Multi-tenant Security**: All users are properly scoped to their companies

## System Architecture

### Database Schema

#### Tables Involved:
- `auth.users` - Supabase auth users
- `public.profiles` - User profiles with company association
- `public.companies` - Company records
- `public.user_invitations` - Invitation tracking
- `public.user_settings` - User preferences

### Trigger System

The system uses a comprehensive trigger `handle_user_onboarding()` that:

1. **Detects signup type**:
   - Admin signup (creates new company)
   - Invited user (joins existing company)
   - Direct user creation (added by admin)

2. **Creates appropriate records**:
   - Profile with correct company association
   - User settings with company context
   - Updates invitation status if applicable

## User Flows

### 1. Admin Signup Flow

```
Landing Page → Admin Signup → Company Creation → Profile Creation → Dashboard
```

**Process:**
1. Admin fills out company and personal details
2. `is_admin_signup: true` metadata is set
3. Trigger creates:
   - New company record
   - Admin profile linked to company
   - User settings with company context

### 2. User Invitation Flow

```
Admin Dashboard → User Management → Invite User → Email Sent → User Onboarding → Dashboard
```

**Process:**
1. Admin enters user email, name, role, and hourly rate
2. System creates invitation record in `user_invitations`
3. Supabase sends invitation email with metadata
4. User clicks link and sets password
5. Trigger creates:
   - Profile linked to inviting admin's company
   - User settings with company context
   - Updates invitation status to "accepted"

### 3. Direct User Creation Flow

```
Admin Dashboard → User Management → Create User → Profile Creation → User Active
```

**Process:**
1. Admin enters user details including password
2. System creates user with company metadata
3. Trigger creates:
   - Profile linked to admin's company
   - User settings with company context
   - Auto-confirmed email

## Implementation Details

### AdminService Methods

#### `createUser(userData: CreateUserData)`
- Creates user with immediate access
- Sets `is_admin_signup: false`
- Trigger handles company assignment

#### `inviteUser(email: string, userData: UserData)`
- Creates invitation record
- Sends Supabase invitation email
- User completes onboarding process

### Database Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_user_onboarding()
RETURNS TRIGGER AS $$
-- Handles all user creation scenarios:
-- 1. Admin signup (creates company)
-- 2. Invited user (joins company)
-- 3. Direct user creation (admin-created)
```

### Security Features

1. **RLS Policies**: Users can only see data from their company
2. **Company Isolation**: All data is scoped to company_id
3. **Invitation Validation**: Email-based invitation system
4. **Role-Based Access**: Different permissions per role

## Testing the System

### 1. Test Admin Signup
```
1. Go to /admin-signup
2. Fill out company name and admin details
3. Submit form
4. Verify:
   - Company created in database
   - Profile created with admin role
   - User settings created
   - Redirected to dashboard
```

### 2. Test User Invitation
```
1. Login as admin
2. Go to Dashboard → User Management
3. Click "Invite User"
4. Fill out user details
5. Submit invitation
6. Verify:
   - Invitation record created
   - Email sent to user
   - User receives invitation email
```

### 3. Test User Onboarding
```
1. User receives invitation email
2. Click invitation link
3. Set password
4. Verify:
   - Profile created with correct company
   - User settings created
   - Invitation status updated
   - User can access dashboard
```

### 4. Test Direct User Creation
```
1. Login as admin
2. Go to Dashboard → User Management
3. Click "Create User"
4. Fill out user details with password
5. Submit form
6. Verify:
   - User created immediately
   - Profile linked to admin's company
   - User can login with provided credentials
```

## Configuration

### Environment Variables Required
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Email Template Configuration
- Configure Supabase email templates
- Set up custom invitation email design
- Configure redirect URLs for onboarding

## Troubleshooting

### Common Issues

1. **"Admin not authenticated" error**
   - Ensure admin is logged in
   - Check if admin has valid profile

2. **"Company not found" error**
   - Verify admin profile has company_id
   - Check company record exists

3. **Invitation email not sent**
   - Verify SMTP settings in Supabase
   - Check email template configuration

4. **User not assigned to company**
   - Check trigger execution
   - Verify invitation record exists
   - Check RLS policies

### Debug Steps

1. **Check trigger logs**:
   ```sql
   SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_user_onboarding%';
   ```

2. **Verify invitation records**:
   ```sql
   SELECT * FROM user_invitations WHERE email = 'user@example.com';
   ```

3. **Check profile creation**:
   ```sql
   SELECT * FROM profiles WHERE user_id = 'user_uuid';
   ```

## Future Enhancements

1. **Batch Invitations**: Invite multiple users at once
2. **Invitation Templates**: Custom invitation messages
3. **Role-Based Invitations**: Different onboarding flows per role
4. **Invitation Analytics**: Track invitation success rates
5. **Automatic Reminders**: Resend invitations automatically

## Security Considerations

1. **Invitation Expiry**: Set expiration times for invitations
2. **Rate Limiting**: Prevent spam invitations
3. **Domain Restrictions**: Limit invitations to specific domains
4. **Audit Logging**: Track all user creation activities

The system is now ready for production use with proper multi-tenant security and comprehensive user onboarding flows.
