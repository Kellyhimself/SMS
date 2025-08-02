# Admin Panel Guide

## Overview

The Admin Panel provides system administrators with tools to manage school registrations, verify new schools, and monitor system activity. This panel is only accessible to users with the `admin` role.

## Accessing the Admin Panel

### Prerequisites
- You must have an account with `admin` role
- You must be logged into the system

### How to Access
1. Log in to your account
2. Navigate to `/admin` in your browser
3. If you have admin privileges, you'll see the admin dashboard
4. If you don't have admin privileges, you'll be redirected to the main dashboard

## Admin Panel Features

### 1. Dashboard (`/admin`)
- **Overview Statistics**: Total schools, pending verifications, verified schools, total users
- **Quick Actions**: Direct links to pending schools, all schools, and security monitoring
- **Recent Activity**: Shows latest school registrations and verifications

### 2. Pending Schools (`/admin/schools/pending`)
- **Review New Registrations**: View all schools awaiting verification
- **Approve/Reject Schools**: Take action on pending school registrations
- **Statistics**: Pending count, new today, average wait time
- **School Details**: View complete school and admin contact information

### 3. All Schools (`/admin/schools`)
- **Complete School List**: View all registered schools with their status
- **Search & Filter**: Find schools by name, email, or admin contact
- **Status Filtering**: Filter by verification status (all, pending, verified, rejected)
- **School Management**: View detailed information about each school

## School Verification Process

### Step 1: School Registration
When a new school registers:
1. School admin creates account and school profile
2. School is automatically set to `pending` verification status
3. School admin cannot access full system until verified

### Step 2: Admin Review
Admin reviews the pending school:
1. Navigate to `/admin/schools/pending`
2. Review school information and admin contact details
3. Check school details for legitimacy

### Step 3: Verification Action
Admin can take one of two actions:

#### Approve School
- Click "Approve" button
- School status changes to `verified`
- School admin gains full system access
- School appears in verified schools list

#### Reject School
- Click "Reject" button
- School status changes to `rejected`
- School admin remains restricted
- Rejection is logged in audit trail

## Security Features

### Role-Based Access Control
- Only users with `admin` role can access admin panel
- Non-admin users are automatically redirected
- All admin actions are logged in audit trail

### Audit Logging
- All verification actions are logged
- Includes action type, timestamp, and admin user
- Provides complete audit trail for compliance

### Data Protection
- School verification status is checked in middleware
- Unverified schools have restricted access
- Admin actions require proper authentication

## API Endpoints

### Admin-Only Endpoints
- `GET /api/admin/schools/pending` - Get pending schools
- `GET /api/admin/schools` - Get all schools with filtering
- `POST /api/admin/schools/[id]/verify` - Approve/reject school

### Security
- All endpoints require admin authentication
- Proper error handling and validation
- Audit logging for all actions

## Troubleshooting

### Common Issues

#### Can't Access Admin Panel
- **Cause**: User doesn't have admin role
- **Solution**: Contact system administrator to grant admin privileges

#### No Pending Schools Showing
- **Cause**: All schools have been processed or no new registrations
- **Solution**: Check if new schools have registered recently

#### Verification Actions Not Working
- **Cause**: School may not be in pending status
- **Solution**: Check school's current verification status

### Error Messages
- **"Unauthorized"**: User not logged in
- **"Forbidden - Admin access required"**: User doesn't have admin role
- **"School not found"**: Invalid school ID
- **"School is not pending verification"**: School already processed

## Best Practices

### Verification Guidelines
1. **Review School Information**: Check school name, email, and contact details
2. **Verify Admin Contact**: Ensure admin contact information is legitimate
3. **Check for Duplicates**: Look for similar school names or emails
4. **Document Decisions**: Use rejection reasons when rejecting schools

### Security Guidelines
1. **Regular Monitoring**: Check pending schools regularly
2. **Audit Review**: Periodically review audit logs
3. **Access Control**: Ensure only authorized users have admin access
4. **Data Protection**: Handle school information securely

## Support

For technical support or questions about the admin panel:
- Check the audit logs for action history
- Review the security documentation
- Contact the development team for issues

---

**Last Updated**: December 2024  
**Version**: 1.0 