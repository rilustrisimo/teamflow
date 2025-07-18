# User Invitation Testing Guide

## Testing Steps for User Invitation Feature

### 1. Prerequisites
- Make sure you have an admin account created
- The development server is running (`npm run dev`)
- Database migrations are up to date

### 2. Test User Invitation Flow

#### Step 1: Login as Admin
1. Navigate to http://localhost:5175
2. Login with an admin account
3. Navigate to the Dashboard → User Management section

#### Step 2: Test Invite User Feature
1. Click "Invite User" button
2. Fill in the form:
   - Email: test@example.com
   - Full Name: Test User
   - Role: Team Member
   - Hourly Rate: 50
3. Click "Send Invite"
4. Should see success message: "User invitation sent successfully"
5. Check the user list - invited user should NOT appear yet (they haven't accepted)

#### Step 3: Test Create User Feature
1. Click "Create User" button
2. Fill in the form:
   - Email: direct@example.com
   - Password: password123
   - Full Name: Direct User
   - Role: Team Member
   - Hourly Rate: 45
3. Click "Create User"
4. Should see success message: "User created successfully"
5. Check the user list - new user should appear immediately

#### Step 4: Verify Multi-Tenant Isolation
1. Create another admin account with different company
2. Login as the second admin
3. Navigate to User Management
4. Verify that you only see users from your own company
5. Users from the first admin's company should NOT be visible

### 3. Expected Behavior

#### User Invitation
- ✅ Creates a record in `user_invitations` table
- ✅ Sends invitation email via Supabase Auth
- ✅ Invitation is scoped to the current admin's company
- ✅ Invited user does not appear in user list until they accept

#### User Creation
- ✅ Creates user immediately in auth.users
- ✅ Triggers onboarding function to create profile
- ✅ User is automatically assigned to admin's company
- ✅ User appears in user list immediately

#### Multi-Tenant Isolation
- ✅ Each admin only sees users from their own company
- ✅ Cannot invite users to other companies
- ✅ Cannot create users in other companies
- ✅ All operations are properly scoped

### 4. Troubleshooting

#### Common Issues
1. **"Could not find column" error**: Database schema issue - check migrations
2. **"Admin not authenticated" error**: Authentication context issue
3. **"Cannot determine company" error**: User profile/company association issue
4. **RLS policy violations**: Row Level Security configuration issue

#### Debug Steps
1. Check browser console for detailed error messages
2. Check Supabase dashboard for database logs
3. Verify migration status with `supabase migration list`
4. Check user profile has correct company_id association

### 5. Database Verification

#### Check User Invitations
```sql
SELECT * FROM public.user_invitations ORDER BY created_at DESC;
```

#### Check User Profiles
```sql
SELECT 
    p.user_id,
    p.full_name,
    p.role,
    p.company_id,
    c.name as company_name
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
ORDER BY c.name, p.full_name;
```

#### Check Companies
```sql
SELECT * FROM public.companies ORDER BY created_at DESC;
```

This testing guide ensures the user invitation and creation features work correctly with proper multi-tenant isolation.
