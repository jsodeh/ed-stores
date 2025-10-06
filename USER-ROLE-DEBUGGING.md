# User Role Debugging Guide

This guide helps you debug and fix issues with your admin/super admin role in the ED Superstore application.

## Common Issues

1. **Profile Not Found**: Your user exists in the auth system but doesn't have a corresponding profile in the `user_profiles` table
2. **Wrong Role**: Your profile exists but doesn't have the correct role (`super_admin`)
3. **RLS Policies**: Database policies might be preventing access even for super admins

## Debugging Tools

### 1. Browser Debugging

Visit `/user-debug` in your browser to see your current user information and run debug checks.

### 2. Database Debugging

Run the SQL script in `fix-user-role.sql` in your Supabase SQL Editor to:
- Check if your user profile exists
- Verify your current role
- Update your role to `super_admin` if needed

### 3. Node.js Script

Run the Node.js script in `fix-user-role.js` to:
- Check if your user exists in the auth system
- Create a profile if it doesn't exist
- Update your role to `super_admin`

## Steps to Fix

1. **Check Current Status**:
   - Visit `/user-debug` in your browser
   - Or run the SQL query in `check-user-role.sql`

2. **Fix Profile/Role**:
   - If no profile exists, create one with role `super_admin`
   - If profile exists but role is not `super_admin`, update it
   - Run the SQL script in `fix-user-role.sql`

3. **Verify Fix**:
   - Sign out and sign back in
   - Visit `/user-debug` again to confirm your role is `super_admin`
   - Try accessing admin pages

## Troubleshooting

If you're still having issues:

1. **Clear Browser Storage**:
   - Clear localStorage and sessionStorage for the site
   - Or use an incognito/private browsing window

2. **Check RLS Policies**:
   - Run the policy check query in `fix-user-role.sql`
   - Ensure policies allow super_admin access

3. **Contact Support**:
   - If issues persist, check the application logs
   - Look for authentication or permission errors in the console