# Feature Implementation Plan - TFI_main Branch

## 1. DATABASE NORMALIZATION ANALYSIS ✅

### Current Schema Analysis (1NF, 2NF, 3NF)

**✅ FIRST NORMAL FORM (1NF):** SATISFIED
- All tables have atomic values (no repeating groups)
- Post-tags relationship properly stored in junction table
- Pool-posts relationship properly stored in junction table

**✅ SECOND NORMAL FORM (2NF):** SATISFIED
- All non-key attributes depend on the entire primary key
- No partial dependencies identified

**⚠️ THIRD NORMAL FORM (3NF):** MOSTLY SATISFIED with ISSUES

**Issues found:**
1. **users table:** Missing `email` field (needed for requirement #2)
2. **users table:** Missing `accepted_tos` field (needed for requirement #5)
3. **users table:** No `password_reset_token` and `reset_token_expiry` (needed for requirement #2)
4. **posts table:** `favorite_count` denormalizes data (can be computed from favorites table)
   - This is a **3NF violation** but acceptable for performance (cache)
   - Solution: Keep it but document as derived data

5. **Missing tables:** No activity log table (needed for requirement #3)

### Recommended Schema Updates

#### New Tables Needed:
```sql
-- Activity log for reporting
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,  -- 'upload', 'download', 'delete', etc.
    post_id INTEGER,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    token TEXT NOT NULL UNIQUE,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Terms & Conditions versions
CREATE TABLE terms_and_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL
);

-- User T&C acceptance records
CREATE TABLE user_tos_acceptance (
    user_id INTEGER NOT NULL,
    tos_id INTEGER NOT NULL,
    accepted_at DATETIME NOT NULL,
    PRIMARY KEY (user_id, tos_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tos_id) REFERENCES terms_and_conditions(id)
);
```

#### Modified users Table:
```sql
-- Add new columns to users table
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN accepted_tos BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN created_at_updated DATETIME;
```

---

## 2. PASSWORD RECOVERY THROUGH EMAIL

### Backend Changes:

**Models:**
- Add email field to UserCreate/UserLogin Pydantic models
- Create PasswordResetRequest model
- Create NewPasswordModel for reset completion

**Endpoints:**
1. `POST /api/auth/request-password-reset` - Generates reset token, sends email
2. `POST /api/auth/validate-reset-token` - Validates token hasn't expired
3. `POST /api/auth/reset-password` - Sets new password using token
4. Update `POST /api/auth/login` - Accept either username OR email

**Implementation Details:**
- Use `secrets.token_urlsafe()` for reset tokens
- Store tokens with 1-hour expiration
- Integrate email service (use `smtplib` or third-party API like SendGrid)
- Hash new password before storing

### Frontend Changes:

**New Components:**
- `ForgotPasswordForm.jsx` - Request password reset
- `ResetPasswordForm.jsx` - Enter new password with token
- Links in `LoginForm.jsx` to "Forgot password?" flow

**Updated api.js:**
- `requestPasswordReset(email)` 
- `validateResetToken(token)`
- `resetPassword(token, newPassword)`

---

## 3. REPORTING - DATA COMPILATION

### Data Points to Track:
```
- Total number of posts
- Total size of uploads folder (MB/GB)
- Total number of users
- Total number of downloads (from activity log)
- Total number of uploads (from activity log)
- Activity by time period: past day/week/month
```

### Backend Endpoints:

```
GET /api/reports/summary - Overall statistics
GET /api/reports/activity - Activity breakdown by period
GET /api/reports/posts - Post statistics
GET /api/reports/users - User statistics
GET /api/reports/storage - Storage usage stats
```

### Backend Implementation:
- Create `analytics_service.py` module
- Functions:
  - `get_post_count()`
  - `get_folder_size()`
  - `get_user_count()`
  - `get_activity_stats(period)` - day/week/month
  - `get_storage_stats()`
  - `get_post_statistics()`

---

## 4. EXPORT & DOWNLOAD REPORTS

### Backend Endpoints:

```
GET /api/reports/export/csv - Export as CSV
GET /api/reports/export/json - Export as JSON
GET /api/reports/export/pdf - Export as PDF (with ReportLab or WeasyPrint)
```

### Output Format:
```csv
Report Generated: 2026-04-28
Period: Last 30 Days

Statistics,Value
Total Posts,145
Total Users,32
Storage Used (MB),2048
Uploads (Past 30 Days),23
Downloads (Past 30 Days),156
...
```

### Frontend Changes:
- Add "Reports" admin dashboard view
- Button to download in different formats
- Display report summary on screen

---

## 5. TERMS & CONDITIONS ON REGISTRATION

### Backend Changes:

**Endpoints:**
- `GET /api/tos/current` - Get current T&C version
- `POST /api/tos` - Create new T&C version (admin only)
- `GET /api/tos/history` - View all T&C versions

**Updated Registration:**
- Modify `POST /api/auth/register` to require `accepted_tos: true`
- Store acceptance in `user_tos_acceptance` table with timestamp

### Frontend Changes:

**Updated RegisterForm.jsx:**
- Add T&C content display (modal or expandable section)
- Add checkbox: "I agree to the Terms and Conditions"
- Fetch current T&C on component mount
- Prevent registration without acceptance

**Suggested T&C Content:**
```
- The site owner is NOT responsible for user-posted content
- All content must comply with local laws
- Illegal content will be removed immediately upon detection
- Users are responsible for their own uploads
- The site reserves right to remove any content
- Privacy policy details
```

---

## 6. USER ROLES & ADMIN CAPABILITIES

### Backend Changes:

**Modify users table:**
- `is_admin` field already exists ✅

**New Endpoints (admin-only):**
- `DELETE /api/admin/posts/{post_id}` - Delete any post
- `DELETE /api/admin/pools/{pool_id}` - Delete any pool
- `DELETE /api/admin/users/{user_id}` - Delete user account
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/{user_id}/role` - Change user role
- `GET /api/admin/audit-log` - View moderation actions

**Admin Helper Middleware:**
- `require_admin()` dependency to check `is_admin` flag

### Frontend Changes:

**Admin Dashboard:**
- `AdminPanel.jsx` - New view accessible only to admins
- Sections:
  - User Management (list, delete, change roles)
  - Content Moderation (delete posts/pools, view user history)
  - Reports (see section 3)
  - Audit Log (view all admin actions)

**Updated Header/Navigation:**
- Show "Admin Panel" link only for admin users

**Content Moderation UI:**
- Flag posts for review
- Direct delete button (admin only) visible on post cards

---

## Implementation Priority

### Phase 1 (Critical - Database)
- ✅ Analyze current schema (DONE)
- Modify users table (add email, tos fields)
- Create new tables (activity_log, password_reset_tokens, terms, acceptance)

### Phase 2 (Auth & Registration)
- Implement password recovery system
- Update login to accept email or username
- Add T&C acceptance requirement

### Phase 3 (Admin & Reporting)
- Implement admin role checks
- Create analytics service
- Build admin endpoints
- Track activity in activity_log

### Phase 4 (Frontend)
- Build admin dashboard
- Create report exports
- Update registration flow
- Update post/pool management UI

---

## Files to Create/Modify

### Backend:
- `init_db.py` - Update schema
- `main.py` - Add endpoints
- `analytics_service.py` - NEW
- `email_service.py` - NEW (optional, for password recovery)

### Frontend:
- `src/components/Auth/ForgotPasswordForm.jsx` - NEW
- `src/components/Auth/ResetPasswordForm.jsx` - NEW
- `src/components/Common/TermsModal.jsx` - NEW
- `src/views/AdminView.jsx` - NEW
- `src/views/ReportsView.jsx` - NEW
- `src/hooks/useAdmin.js` - NEW
- `src/hooks/useReports.js` - NEW
- `src/api.js` - Update with new endpoints
- `src/components/Auth/RegisterForm.jsx` - Update
- `src/App.jsx` - Add admin routes

---

## Database Schema - Final Version

```
users (MODIFIED)
├─ id (PK)
├─ username (UNIQUE)
├─ email (UNIQUE, NEW)
├─ password_hash
├─ is_admin
├─ accepted_tos (NEW)
├─ created_at

posts (UNCHANGED)
├─ id (PK)
├─ image_filename
├─ uploader_id (FK)
├─ upload_date
├─ description
├─ favorite_count (derived, for perf)

tags (UNCHANGED)
├─ id (PK)
├─ tag_name (UNIQUE)

post_tags (UNCHANGED)
├─ post_id (FK, PK)
├─ tag_id (FK, PK)

favorites (UNCHANGED)
├─ user_id (FK, PK)
├─ post_id (FK, PK)
├─ favorited_at

pools (UNCHANGED)
├─ id (PK)
├─ name
├─ description
├─ creator_id (FK)
├─ created_at

pool_posts (UNCHANGED)
├─ pool_id (FK, PK)
├─ post_id (FK, PK)
├─ order_index

activity_log (NEW) ✨
├─ id (PK)
├─ user_id (FK)
├─ action_type
├─ post_id (FK, optional)
├─ timestamp

password_reset_tokens (NEW) ✨
├─ id (PK)
├─ user_id (FK, UNIQUE)
├─ token (UNIQUE)
├─ created_at
├─ expires_at

terms_and_conditions (NEW) ✨
├─ id (PK)
├─ version (UNIQUE)
├─ content
├─ created_at

user_tos_acceptance (NEW) ✨
├─ user_id (FK, PK)
├─ tos_id (FK, PK)
├─ accepted_at
```

---

## ✅ Normalization Conclusion

**Current database IS mostly 3NF compliant:**
- Only violation: `posts.favorite_count` (derived attribute)
- This is acceptable as a performance optimization (caching)
- Alternative: Remove it and compute on-the-fly (slower)

**Recommendation:** Keep `favorite_count` as-is for performance, document it as derived data in code comments.
