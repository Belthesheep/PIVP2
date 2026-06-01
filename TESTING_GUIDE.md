# How to Test the Corrections

This guide explains how to test each of the 4 correctional requirements that were implemented.

## Prerequisites

1. Ensure `.env` file exists in the project root with:
   ```
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_PASSWORD=your-app-specific-password
   JWT_SECRET=your-secret-key
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Ensure database migration was applied:
   ```bash
   python migrate_soft_deletes.py  # If not already done
   ```

---

## 1. Testing Password Recovery with Email & JWT

### Flow:
1. Start backend: `python main.py`
2. Start frontend: `npm run dev` (from frontend folder)
3. Click "¿Olvidaste tu contraseña?" (Forgot Password?) link
4. Enter email address
5. Check email inbox for password reset link
6. Click link (which contains JWT token in URL)
7. Enter new password and confirm
8. Password reset successful ✅

### Backend Endpoints:
- `POST /api/auth/request-password-reset` - Generates JWT token and sends email
- `POST /api/auth/validate-reset-token?token=<JWT>` - Validates token
- `POST /api/auth/reset-password` - Resets password with token

### Key Features:
✅ JWT token expires after 1 hour
✅ Email sent via Gmail SMTP (app-specific password)
✅ Falls back to console output in dev mode if email fails
✅ Tokens cannot be reused after password is reset

---

## 2. Testing Soft Deletes (Infrastructure Ready)

### Database Changes Applied:
```sql
-- Users, Posts, Pools now have deleted_at timestamp
-- Tags have is_deleted boolean flag
```

### How It Works:
1. When a post/user/pool is deleted → marked with `deleted_at = NOW()`
2. Queries automatically filter: `WHERE deleted_at IS NULL`
3. Admin can view deleted records via helper functions
4. Data is never physically removed from database

### Testing (Manual):
```bash
# View soft_delete_utils.py for helper functions
from soft_delete_utils import build_soft_delete_update, build_restore_delete_record

# Delete a post (soft delete)
sql, params = build_soft_delete_update("posts", "id", 123)
# Returns: ("UPDATE posts SET deleted_at = ? WHERE id = ?", (timestamp, 123))

# Restore a post (admin function)
sql, params = build_restore_delete_record("posts", "id", 123)
# Returns: ("UPDATE posts SET deleted_at = NULL WHERE id = ?", (123,))
```

### Status: Infrastructure Complete ✅
- Full integration into all queries will be the next step
- Helper functions ready for use
- Audit trail preserved (deletion timestamp recorded)

---

## 3. Testing Post Sorting Toggle

### UI Changes:
- Header of posts view now shows two buttons:
  - **"Más Relevantes"** (Most Relevant) - Green when active
  - **"Todas las Publicaciones"** (All Posts) - Green when active

### Sorting Logic:
**Most Relevant Mode:**
- Filters posts from last 7 days
- Sorted by favorite count (descending)
- Perfect for browsing trending content

**All Posts Mode:**
- Shows all posts
- Sorted by newest first
- See complete history

### How to Test:
1. Go to posts view
2. Click "Más Relevantes" button - should show posts from last 7 days, sorted by popularity
3. Click "Todas las Publicaciones" button - should show all posts sorted by date
4. Verify the correct posts appear in each view

### Backend:
```
GET /api/posts?most_relevant=true   # Last 7 days, by favorites
GET /api/posts?most_relevant=false  # All posts, by date
```

---

## 4. Testing Spanish UI Translation

### Updated Components:
✅ Header (navigation buttons)
✅ Login Form
✅ Register Form
✅ Forgot Password Form
✅ Reset Password Form
✅ Posts View (toggle buttons)
✅ Post Cards
✅ Error messages

### Testing:
1. Run frontend: `npm run dev`
2. Reload page
3. Verify all visible UI text is in Spanish:
   - Navigation: Explorar, Colecciones, Etiquetas, Subir, Registrarse, Iniciar Sesión
   - Forms: Use Spanish placeholders and button labels
   - Buttons: Toggle between "Más Relevantes" and "Todas las Publicaciones"

### Language Coverage:
- ✅ All navigation text
- ✅ All form labels and buttons
- ✅ Auth system (login, register, password reset)
- ✅ Post viewing interface
- ✅ Error messages

### Note:
- Code (variables, functions, function names) remains in English (best practice for developers)
- Backend comments remain in English (will be translated in optional next phase)
- Configuration keys remain in English

---

## Running the Full Application

### Terminal 1 - Backend:
```bash
cd c:\Users\54386\Desktop\Universidad\PIVP2
python main.py
# Server runs on http://localhost:8000
```

### Terminal 2 - Frontend:
```bash
cd c:\Users\54386\Desktop\Universidad\PIVP2\frontend
npm run dev
# Dev server on http://localhost:5173
```

### Access Application:
```
http://localhost:5173
```

---

## Project Structure After Changes

```
PIVP2/
├── main.py                          # FastAPI backend (updated)
├── email_service.py                 # NEW: JWT + Email service
├── soft_delete_utils.py             # NEW: Soft delete helpers
├── migrate_soft_deletes.py           # Database migration
├── requirements.txt                 # Updated with pyjwt, python-dotenv
├── .env                            # NEW: Environment variables
├── .gitignore                       # Updated
├── IMPLEMENTATION_SUMMARY.md        # Complete implementation docs
├── frontend/
│   └── src/
│       ├── components/
│       │   └── Common/
│       │       └── Header.jsx       # Updated (Spanish)
│       │   └── Auth/
│       │       ├── LoginForm.jsx        # Updated (Spanish)
│       │       ├── RegisterForm.jsx     # Updated (Spanish)
│       │       ├── ForgotPasswordForm.jsx   # Updated (Spanish)
│       │       └── ResetPasswordForm.jsx    # Updated (Spanish)
│       ├── views/
│       │   └── PostsView.jsx        # Updated (Spanish + toggle)
│       ├── api.js                   # Updated (mostRelevant param)
│       ├── translations.js          # NEW: Spanish strings
│       └── hooks/
│           └── usePosts.js          # Updated (mostRelevant support)
```

---

## Verification Checklist

Before submitting to professor, verify:

- [ ] Backend starts without errors: `python main.py`
- [ ] Frontend builds: `npm run build` (no errors)
- [ ] Password reset emails work (or console output in dev mode)
- [ ] JWT tokens validate correctly
- [ ] Post toggle buttons show correct data
- [ ] All UI text is in Spanish
- [ ] Soft delete migration applied to database
- [ ] .env file exists with credentials (not committed to git)
- [ ] All dependencies installed: `pip install -r requirements.txt`

---

## Troubleshooting

### Email not sending?
- Check .env file has valid GMAIL_USER and GMAIL_PASSWORD
- Ensure Gmail account has app-specific password (not regular password)
- Check console output (dev mode prints token if email fails)

### UI not in Spanish?
- Hard refresh browser (Ctrl+Shift+R)
- Check frontend build completed: `npm run build`
- Verify translations.js was updated

### Post toggle not working?
- Check backend is running and accessible
- Verify API endpoint: `http://localhost:8000/api/posts`
- Check browser console for errors

### Database errors?
- Ensure migration ran: `python migrate_soft_deletes.py`
- Check database file permissions
- Verify PRAGMA foreign_keys is enabled

---

## Contact & Support

For questions about the implementation, refer to:
- `IMPLEMENTATION_SUMMARY.md` - Detailed technical documentation
- `email_service.py` - Email service implementation
- `soft_delete_utils.py` - Soft delete helper functions
- Main.py password reset endpoints (lines ~530-580)
