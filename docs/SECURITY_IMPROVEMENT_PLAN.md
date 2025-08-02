# Security Improvement Plan for User Registration System

## 🚨 Current Security Vulnerabilities

### Critical Issues Identified

#### 1. **Open Registration for Any Role**
- **Location**: `src/components/forms/register-form.tsx`
- **Issue**: Anyone can register as `admin`, `teacher`, `accountant`, or `parent` without authorization
- **Risk Level**: CRITICAL
- **Impact**: Unauthorized users can gain full system access

#### 2. **Unrestricted School Creation**
- **Location**: `src/services/auth.service.ts`
- **Issue**: Any user can create a new school and become its admin
- **Risk Level**: CRITICAL
- **Impact**: Potential for fake schools and unauthorized access

#### 3. **No Role-Based Access Control for Registration**
- **Issue**: No validation of user's right to register for specific roles
- **Risk Level**: HIGH
- **Impact**: Unauthorized role assignment

#### 4. **No School Affiliation Validation**
- **Issue**: Users can register for any school without proving affiliation
- **Risk Level**: HIGH
- **Impact**: Unauthorized access to school data

## 🛡️ Security Improvement Plan

### Phase 1: Restrict Registration to Admin-Only (Week 1)

#### 1.1 Modify Registration Schema
**Files to Update**:
- `src/types/auth.ts`
- `src/components/forms/register-form.tsx`
- `src/services/auth.service.ts`

**Changes**:
```typescript
// Only allow admin registration for new schools
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.literal('admin'), // Only admin allowed
  school: z.object({
    name: z.string().min(2, 'School name must be at least 2 characters'),
    email: z.string().email('Invalid school email address'),
    address: z.string().optional(),
    phone: z.string().optional(),
    subscription_plan: z.enum(['core', 'premium']),
  }),
})
```

#### 1.2 Update Registration Form
- Remove role selection dropdown
- Add disclaimer about admin-only registration
- Update form validation

#### 1.3 Add School Verification Status
- Add `verification_status` field to schools table
- Default new schools to `pending` status
- Restrict access until verified

### Phase 2: Implement Invitation System (Week 2-3)

#### 2.1 Create Invitation Tables
**New Migration**: `migrations/create_user_invitations.sql`

```sql
-- User invitations table
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'parent', 'accountant')),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_school ON user_invitations(school_id);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);
```

#### 2.2 Create Invitation Service
**New File**: `src/services/invitation.service.ts`

```typescript
export const invitationService = {
  async createInvitation(data: {
    email: string
    role: 'teacher' | 'parent' | 'accountant'
    school_id: string
    invited_by: string
  }): Promise<UserInvitation> {
    // Implementation
  },

  async acceptInvitation(invitationId: string, userData: {
    name: string
    password: string
  }): Promise<AuthResponse> {
    // Implementation
  },

  async listInvitations(schoolId: string): Promise<UserInvitation[]> {
    // Implementation
  },

  async revokeInvitation(invitationId: string): Promise<void> {
    // Implementation
  }
}
```

#### 2.3 Create Invitation API Routes
**New Files**:
- `src/app/api/invitations/route.ts` (POST, GET)
- `src/app/api/invitations/[id]/accept/route.ts` (POST)
- `src/app/api/invitations/[id]/revoke/route.ts` (DELETE)

#### 2.4 Create Invitation Components
**New Files**:
- `src/components/forms/invite-user-form.tsx`
- `src/components/ui/invitation-list.tsx`
- `src/components/ui/invitation-card.tsx`

### Phase 3: Add School Verification Process (Week 3-4)

#### 3.1 Create School Verification Tables
**New Migration**: `migrations/create_school_verification.sql`

```sql
-- School verification table
CREATE TABLE school_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verification_documents JSONB,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add verification_status to schools table
ALTER TABLE schools ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
```

#### 3.2 Create Verification Service
**New File**: `src/services/verification.service.ts`

```typescript
export const verificationService = {
  async submitVerification(schoolId: string, documents: File[]): Promise<void> {
    // Implementation
  },

  async verifySchool(schoolId: string, verifiedBy: string): Promise<void> {
    // Implementation
  },

  async rejectSchool(schoolId: string, reason: string): Promise<void> {
    // Implementation
  }
}
```

#### 3.3 Create Verification Components
**New Files**:
- `src/components/forms/school-verification-form.tsx`
- `src/components/ui/verification-status.tsx`

### Phase 4: Create Admin User Management Interface (Week 4-5)

#### 4.1 Create User Management Pages
**New Files**:
- `src/app/(dashboard)/admin/users/page.tsx`
- `src/app/(dashboard)/admin/users/invite/page.tsx`
- `src/app/(dashboard)/admin/users/[id]/edit/page.tsx`

#### 4.2 Create User Management Components
**New Files**:
- `src/components/admin/user-management/user-list.tsx`
- `src/components/admin/user-management/user-card.tsx`
- `src/components/admin/user-management/role-selector.tsx`
- `src/components/admin/user-management/user-actions.tsx`

#### 4.3 Create User Management Service
**New File**: `src/services/user-management.service.ts`

```typescript
export const userManagementService = {
  async listUsers(schoolId: string): Promise<User[]> {
    // Implementation
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    // Implementation
  },

  async deactivateUser(userId: string): Promise<void> {
    // Implementation
  },

  async getUserActivity(userId: string): Promise<UserActivity[]> {
    // Implementation
  }
}
```

### Phase 5: Add Audit Logging (Week 5-6)

#### 5.1 Create Audit Log Tables
**New Migration**: `migrations/create_audit_logs.sql`

```sql
-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

#### 5.2 Create Audit Service
**New File**: `src/services/audit.service.ts`

```typescript
export const auditService = {
  async logAction(data: {
    userId: string
    action: string
    resourceType: string
    resourceId?: string
    details?: Record<string, any>
  }): Promise<void> {
    // Implementation
  },

  async getAuditLogs(filters: {
    userId?: string
    action?: string
    startDate?: Date
    endDate?: Date
  }): Promise<AuditLog[]> {
    // Implementation
  }
}
```

## 🔧 Implementation Details

### Database Schema Changes

#### New Tables Required:
1. `user_invitations` - Store user invitations
2. `school_verifications` - Store school verification data
3. `audit_logs` - Store system audit trail

#### Modified Tables:
1. `schools` - Add `verification_status` field
2. `users` - Add `invited_by` and `invitation_id` fields

### API Endpoints to Create

#### Invitation Endpoints:
- `POST /api/invitations` - Create invitation
- `GET /api/invitations` - List invitations
- `POST /api/invitations/[id]/accept` - Accept invitation
- `DELETE /api/invitations/[id]` - Revoke invitation

#### Verification Endpoints:
- `POST /api/schools/[id]/verify` - Submit verification
- `PUT /api/schools/[id]/verify` - Approve/reject verification
- `GET /api/schools/[id]/verification` - Get verification status

#### User Management Endpoints:
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Deactivate user
- `GET /api/admin/users/[id]/activity` - Get user activity

### Frontend Components to Create

#### Forms:
- `InviteUserForm` - For inviting new users
- `SchoolVerificationForm` - For submitting school verification
- `UserEditForm` - For editing user details

#### UI Components:
- `InvitationList` - Display pending invitations
- `UserList` - Display school users
- `VerificationStatus` - Show verification status
- `AuditLogViewer` - View audit logs

## 🚀 Migration Strategy

### Step 1: Database Migration
1. Run new migration files
2. Update existing data to set default verification status
3. Create indexes for performance

### Step 2: Backend Implementation
1. Implement invitation service
2. Implement verification service
3. Implement user management service
4. Implement audit service
5. Create API endpoints

### Step 3: Frontend Implementation
1. Update registration form
2. Create invitation components
3. Create verification components
4. Create user management interface
5. Add audit logging

### Step 4: Testing
1. Unit tests for all services
2. Integration tests for API endpoints
3. End-to-end tests for user flows
4. Security testing

### Step 5: Deployment
1. Deploy database migrations
2. Deploy backend changes
3. Deploy frontend changes
4. Monitor for issues

## 📊 Success Metrics

### Security Metrics:
- [ ] Zero unauthorized admin registrations
- [ ] All new users invited by existing admins
- [ ] All schools verified before full access
- [ ] Complete audit trail for all user actions

### User Experience Metrics:
- [ ] Registration process completion rate
- [ ] Invitation acceptance rate
- [ ] User management interface usage
- [ ] Support ticket reduction

## 🔒 Security Checklist

### Before Deployment:
- [ ] All role-based access controls implemented
- [ ] Invitation system tested
- [ ] Verification process tested
- [ ] Audit logging verified
- [ ] Security testing completed
- [ ] Documentation updated

### After Deployment:
- [ ] Monitor for unauthorized access attempts
- [ ] Track invitation acceptance rates
- [ ] Monitor verification process
- [ ] Review audit logs regularly
- [ ] Update security measures as needed

## 📝 Documentation Updates

### Files to Update:
1. `README.md` - Add security section
2. `docs/API.md` - Document new endpoints
3. `docs/DEPLOYMENT.md` - Add security considerations
4. `docs/USER_GUIDE.md` - Update user registration process

### New Documentation:
1. `docs/SECURITY.md` - Security guidelines
2. `docs/ADMIN_GUIDE.md` - Admin user management guide
3. `docs/VERIFICATION_PROCESS.md` - School verification process

## 🎯 Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Phase 1 | Restricted registration, updated forms |
| 2-3 | Phase 2 | Invitation system, API endpoints |
| 3-4 | Phase 3 | School verification process |
| 4-5 | Phase 4 | Admin user management interface |
| 5-6 | Phase 5 | Audit logging, monitoring |

**Total Duration**: 6 weeks
**Critical Path**: Phases 1-2 (Weeks 1-3)

## 🚨 Risk Mitigation

### High-Risk Items:
1. **Data Migration**: Backup all data before schema changes
2. **User Experience**: Provide clear messaging about new process
3. **Performance**: Monitor database performance with new indexes
4. **Security**: Implement gradual rollout with monitoring

### Contingency Plans:
1. **Rollback Plan**: Keep old registration system as fallback
2. **Support Plan**: Train support team on new processes
3. **Communication Plan**: Notify users of changes in advance

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: After Phase 1 completion 