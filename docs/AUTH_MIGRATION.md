# Authentication Migration Plan

## Current State
- **Parent Auth**: Custom OTP + IndexedDB (isolated)
- **School Auth**: Supabase email/password + offline support
- **SMS**: Twilio integration already exists

## Recommended Approach: Incremental Migration

### Phase 1: Parent Auth → Supabase SMS (Week 1-2) ✅ **LOW RISK**

**Why start with parents:**
- ✅ Doesn't affect school onboarding
- ✅ Simpler use case (just OTP)
- ✅ Already isolated system
- ✅ Key market differentiator

**Changes Made:**
- ✅ Updated `parent-auth.service.ts` to use Supabase `signInWithOtp`
- ✅ Added `supabase_user_id` to IndexedDB schema
- ✅ Maintained same interface for backward compatibility

**Next Steps:**
1. Configure Supabase SMS settings in dashboard
2. Test parent authentication flow
3. Verify offline session management
4. Update error handling for Supabase errors

### Phase 2: School Auth Enhancement (Week 3-4) ⚠️ **MEDIUM RISK**

**Add SMS option to existing school auth:**
- Extend `auth.service.ts` with SMS login option
- Keep email/password as primary method
- Add phone field to users table
- Update login UI with SMS option

### Phase 3: Full Unification (Week 5-6) ⚠️ **HIGH RISK**

**Complete migration:**
- Create unified auth service
- Merge parent and school auth contexts
- Update all authentication flows
- Comprehensive testing and validation

## Risk Assessment

### Phase 1: Low Risk ✅
- Isolated system
- Easy rollback
- No impact on core functionality

### Phase 2: Medium Risk ⚠️
- Affects existing school users
- Need backward compatibility
- Extensive testing required

### Phase 3: High Risk ⚠️
- Major system changes
- Complex migration
- Requires careful planning

## Success Criteria

### Phase 1 Success:
- ✅ Parent login works with Supabase SMS
- ✅ No regression in functionality
- ✅ Offline support maintained
- ✅ Error handling robust

### Phase 2 Success:
- ✅ School users can use SMS login
- ✅ Email/password still works
- ✅ Session management unified
- ✅ No data loss

### Phase 3 Success:
- ✅ All auth unified
- ✅ Consistent user experience
- ✅ Improved security
- ✅ Reduced complexity

## Configuration Required

### Supabase Settings:
```bash
# Enable phone auth in dashboard
# Configure Twilio SMS provider
# Set up SMS templates
# Configure rate limiting
```

### Environment Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## Rollback Plan

### Phase 1 Rollback:
- Revert to custom OTP system
- No database changes needed

### Phase 2 Rollback:
- Remove SMS option from school auth
- Keep email/password only

### Phase 3 Rollback:
- Revert to separate auth systems
- Restore original service files

## Timeline

**Week 1-2**: Phase 1 (Parent Auth) ✅
**Week 3-4**: Phase 2 (School Auth Enhancement)
**Week 5-6**: Phase 3 (Full Unification)

## Benefits

- **Improved security** with Supabase's battle-tested auth
- **Better reliability** with managed SMS delivery
- **Reduced complexity** with unified codebase
- **Enhanced features** like session management
- **Market advantage** with seamless parent portal access 