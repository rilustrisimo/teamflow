# Role-Based Testing Guide

## Testing Role-Based UI Separation

### Admin User Creation

1. **Navigate to**: `http://localhost:5173/auth`
2. **Click**: "Create Account" to switch to signup mode
3. **Fill in**:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Full Name: `System Administrator`
   - Role: `admin` (select from dropdown)
   - Company Name: `TeamFlow Inc` (optional)
4. **Click**: "Create Account"

### Test User Accounts

#### Admin User
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Expected Features**: All navigation items, user management, system settings

#### Manager User
- **Email**: `manager@example.com`
- **Password**: `manager123`
- **Role**: `manager`
- **Expected Features**: Project oversight, team management, financial data

#### Team Member User
- **Email**: `team@example.com`
- **Password**: `team123`
- **Role**: `team-member`
- **Expected Features**: Personal dashboard, time tracking, assigned tasks

#### Client User
- **Email**: `client@example.com`
- **Password**: `client123`
- **Role**: `client`
- **Expected Features**: Project visibility, time reports, invoices

## Role-Based Navigation Testing

### Admin Navigation
- ✅ Dashboard (AdminDashboard component)
- ✅ User Management (UserManagement component)
- ✅ All Projects (full access)
- ✅ Clients (full CRUD)
- ✅ Reports (all data)
- ✅ Financial (complete access)
- ✅ Settings (system configuration)

### Manager Navigation
- ✅ Dashboard (overview)
- ✅ All Projects (oversight)
- ✅ Clients (management)
- ✅ Reports (team data)
- ✅ Financial (department data)

### Team Member Navigation
- ✅ Dashboard (TeamMemberDashboard component)
- ✅ Time Tracker (personal)
- ✅ My Tasks (assigned only)
- ✅ My Projects (assigned only)
- ✅ My Reports (personal data)

### Client Navigation
- ✅ Dashboard (ClientDashboard component)
- ✅ My Projects (own projects)
- ✅ Time Reports (own projects)
- ✅ Invoices (own invoices)

## Permission Testing

### Admin Permissions
- ✅ `canAccessUserManagement`: true
- ✅ `canAccessAllProjects`: true
- ✅ `canAccessFinancialData`: true
- ✅ `canManageUsers`: true
- ✅ `canCreateProjects`: true
- ✅ `canDeleteProjects`: true

### Manager Permissions
- ✅ `canAccessUserManagement`: false
- ✅ `canAccessAllProjects`: true
- ✅ `canAccessFinancialData`: true
- ✅ `canManageUsers`: false
- ✅ `canCreateProjects`: true
- ✅ `canDeleteProjects`: false

### Team Member Permissions
- ✅ `canAccessUserManagement`: false
- ✅ `canAccessAllProjects`: false
- ✅ `canAccessFinancialData`: false
- ✅ `canAccessTimeTracker`: true
- ✅ `canViewOwnTasks`: true
- ✅ `canEditTimeEntries`: true

### Client Permissions
- ✅ `canAccessUserManagement`: false
- ✅ `canAccessAllProjects`: false
- ✅ `canAccessTimeTracker`: false
- ✅ `canAccessInvoices`: true
- ✅ `canViewClientData`: true

## Route Protection Testing

### Protected Routes
- `/dashboard` - All authenticated users
- `/dashboard?tab=users` - Admin only
- `/dashboard?tab=financial` - Admin + Manager
- `/dashboard?tab=timetracker` - Admin + Manager + Team Member
- `/dashboard?tab=settings` - Admin + Manager

### Expected Behaviors
- **Unauthorized Access**: Shows role-appropriate error message
- **Fallback Navigation**: Redirects to appropriate dashboard
- **Loading States**: Shows loading spinner while checking permissions
- **Error Messages**: Role-specific error messages and guidance

## Data Filtering Testing

### Projects
- **Admin**: All projects visible
- **Manager**: All projects visible
- **Team Member**: Only assigned projects
- **Client**: Only own projects

### Tasks
- **Admin**: All tasks visible
- **Manager**: All tasks visible
- **Team Member**: Only assigned tasks
- **Client**: Tasks for own projects

### Time Entries
- **Admin**: All time entries visible
- **Manager**: All time entries visible
- **Team Member**: Only own time entries
- **Client**: Time entries for own projects

## Error Handling Testing

### Test Cases
1. **Access Denied**: Try accessing restricted features
2. **Session Expired**: Test with expired authentication
3. **Role Mismatch**: Test with incorrect role assignments
4. **Permission Denied**: Test unauthorized actions

### Expected Results
- **Role-Appropriate Messages**: Different error messages for each role
- **Helpful Guidance**: Clear instructions for each user type
- **Fallback Options**: Alternative actions when access is denied
- **Contact Information**: Appropriate contact suggestions

## Quick Actions Testing

### Admin Quick Actions
- ✅ Add User
- ✅ New Project
- ✅ Generate Report
- ✅ System Settings

### Manager Quick Actions
- ✅ New Project
- ✅ Assign Task
- ✅ Add Client
- ✅ Generate Invoice

### Team Member Quick Actions
- ✅ Start Timer
- ✅ Create Task
- ✅ View Schedule
- ✅ Time Report

### Client Quick Actions
- ✅ View Projects
- ✅ Time Reports
- ✅ View Invoices
- ✅ Project Archive

## Database Testing

### Profile Creation
- Test automatic profile creation on signup
- Verify role assignment in database
- Check profile data consistency

### RLS Policies
- Test row-level security for each table
- Verify data isolation between roles
- Check permission enforcement at database level

## Performance Testing

### Navigation Performance
- Test navigation speed with role-based filtering
- Check permission evaluation performance
- Verify component rendering efficiency

### Data Loading
- Test data filtering performance
- Check role-based query optimization
- Verify loading states and error handling

## Security Testing

### Authentication
- Test session management
- Verify role persistence
- Check logout functionality

### Authorization
- Test permission boundaries
- Verify role-based access control
- Check data access restrictions

## Mobile Testing

### Responsive Design
- Test role-based navigation on mobile
- Verify sidebar collapse/expand
- Check touch interactions

### Performance
- Test mobile performance with role-based features
- Check loading times on mobile devices
- Verify touch-friendly interfaces

## Troubleshooting

### Common Issues
1. **Profile Not Created**: Check database trigger
2. **Role Not Assigned**: Verify signup process
3. **Permission Denied**: Check role-based permissions
4. **Navigation Missing**: Verify role-based navigation hook

### Debug Steps
1. Check browser console for errors
2. Verify user profile in database
3. Test permission hooks manually
4. Check role-based filtering logic

## Success Criteria

### Functional Requirements
- ✅ All user types can sign up successfully
- ✅ Role-based navigation works correctly
- ✅ Permission system enforces access control
- ✅ Data filtering works for all roles
- ✅ Error handling provides appropriate messages

### User Experience
- ✅ Intuitive navigation for each role
- ✅ Clear error messages and guidance
- ✅ Responsive design on all devices
- ✅ Fast loading and smooth interactions

### Security
- ✅ Proper authentication and authorization
- ✅ Data isolation between roles
- ✅ Secure error handling
- ✅ Protection against unauthorized access
