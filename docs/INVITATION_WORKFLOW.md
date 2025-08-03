# Invitation Workflow

## Overview

The invitation system allows school administrators to invite new users (teachers, parents, accountants) to join the School Management System.

## Workflow Steps

### 1. Admin Creates Invitation

1. Admin navigates to the admin panel
2. Uses the "Invite User" form to enter:
   - Email address of the recipient
   - Role (teacher, parent, or accountant)
   - School ID (automatically set to admin's school)
3. System creates invitation record in database
4. System sends email to recipient with invitation link

### 2. Email Notification

When an invitation is created, the system automatically sends an email to the recipient containing:

- Subject: "You have been invited to join our School Management System"
- Content includes:
  - Role they're being invited for
  - Direct link to accept invitation
  - Expiration date (7 days from creation)
  - Contact information for questions

### 3. Recipient Accepts Invitation

1. Recipient clicks the link in the email
2. Link takes them to `/accept-invitation/[invitation-id]`
3. Recipient fills out the form with:
   - Their name
   - Password (minimum 6 characters)
   - Password confirmation
4. System validates the invitation:
   - Checks if invitation exists
   - Verifies invitation hasn't expired
   - Ensures invitation hasn't been accepted
5. System creates user account:
   - Creates Supabase auth user
   - Creates user profile in database
   - Updates invitation status to 'accepted'
   - Signs in the user automatically

### 4. User Access

After accepting the invitation:
- User is automatically signed in
- User can access the system based on their role
- User receives appropriate permissions for their role

## API Endpoints

### Create Invitation
- **POST** `/api/invitations`
- Requires admin authentication
- Body: `{ email, role, school_id }`
- Response: Created invitation object

### List Invitations
- **GET** `/api/invitations`
- Requires admin authentication
- Query params: `status`, `role`, `email`
- Response: Array of invitations

### Accept Invitation (Get Details)
- **GET** `/api/invitations/[id]/accept`
- Public endpoint (no authentication required)
- Response: Invitation and school details

### Accept Invitation (Submit)
- **POST** `/api/invitations/[id]/accept`
- Public endpoint (no authentication required)
- Body: `{ name, password }`
- Response: User and session data

### Revoke Invitation
- **DELETE** `/api/invitations/[id]/revoke`
- Requires admin authentication
- Response: Success message

### Resend Invitation
- **POST** `/api/invitations/[id]/resend`
- Requires admin authentication
- Response: Updated invitation and success message

## Email Configuration

The system uses Resend for email delivery. Required environment variables:

- `RESEND_API_KEY`: Your Resend API key
- `NEXT_PUBLIC_APP_URL`: Your application's base URL

## Security Features

1. **School Isolation**: Admins can only invite users to their own school
2. **Role Validation**: Only valid roles (teacher, parent, accountant) are accepted
3. **Expiration**: Invitations expire after 7 days
4. **Single Use**: Each invitation can only be accepted once
5. **Email Validation**: System checks for existing invitations to prevent duplicates

## Error Handling

- Email sending failures don't prevent invitation creation
- Failed emails can be resent using the resend functionality
- Expired invitations are automatically marked as expired
- Invalid invitations return appropriate error messages

## Database Schema

The invitation system uses the `user_invitations` table with the following key fields:

- `id`: Unique invitation identifier
- `email`: Recipient's email address
- `role`: User role (teacher, parent, accountant)
- `school_id`: School the user is being invited to
- `invited_by`: ID of the admin who sent the invitation
- `status`: Invitation status (pending, accepted, expired)
- `expires_at`: Expiration timestamp
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp 