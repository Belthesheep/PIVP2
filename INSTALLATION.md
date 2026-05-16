# Installation & Setup Guide

This guide will help you set up the Sheepbooru project on your laptop.

## Prerequisites

Before starting, make sure you have the following installed:

- **Python 3.10+** (via Miniconda or system Python) - [Download Miniconda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/windows.html)
- **Node.js 16+** (includes npm) - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd PIVP2
```

## Step 2: Backend Setup (Python/FastAPI)

### 2.1 Create Python Virtual Environment

Using Miniconda (recommended):
```bash
conda create -n sheepbooru python=3.10
conda activate sheepbooru
```

Or using venv:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Initialize Database

```bash
python init_db.py
```

This will create `sheepbooru.db` with the complete schema.

### 2.4 Run Backend Server

```bash
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started server process [XXXX]
```

## Step 3: Frontend Setup (React/Vite)

### 3.1 Install Node Dependencies

Open a new terminal window (keep the backend running):

```bash
cd frontend
npm install
```

### 3.2 Run Frontend Dev Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

You should see output like:
```
VITE v7.2.4  ready in 1234 ms

➜  Local:   http://localhost:5173/
```

## Step 4: Access the Application

Both servers are now running:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000

Open your browser to `http://localhost:5173` and start using the app!

## Project Structure

```
PIVP2/
├── main.py                    # FastAPI backend
├── analytics_service.py       # Reporting service
├── export_service.py          # PDF/CSV/JSON export
├── init_db.py                 # Database initialization
├── requirements.txt           # Python dependencies
├── sheepbooru.db             # SQLite database (created on first run)
├── uploads/                  # User-uploaded images and videos
├── frontend/                 # React application
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.js        # Vite configuration
│   └── src/
│       ├── App.jsx           # Main app component
│       ├── App.css           # Styling
│       ├── api.js            # API client
│       ├── components/       # React components
│       ├── hooks/            # Custom React hooks
│       ├── views/            # Page views
│       └── utils/            # Utility functions
└── ARCHITECTURE.md           # Technical documentation
```

## Features

- 👤 **User Authentication**: Register, login, password recovery
- 📸 **Media Upload**: Images and videos (MP4, WebM, MOV, AVI)
- 🏷️ **Tags System**: Browse and filter posts by tags
- ⭐ **Favorites**: Save your favorite posts
- 🎨 **Pools**: Organize posts into collections
- 📊 **Admin Panel**: User management, moderation, reporting
- 📈 **Reports & Exports**: Generate CSV/JSON/PDF reports
- 📱 **Responsive Design**: Works on desktop and mobile

## Database

The SQLite database (`sheepbooru.db`) includes:
- `users` - User accounts and authentication
- `posts` - Images and videos
- `tags` - Content tags
- `favorites` - User favorites
- `pools` - Post collections
- `activity_log` - Admin activity tracking
- And more...

First run automatically creates and populates all tables.

## Development Commands

### Backend
```bash
# Run with auto-reload
uvicorn main:app --reload

# Run on specific port
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Database
```bash
# Initialize/reset database
python init_db.py

# Migrate schema changes
python migrate_db.py
```

## Troubleshooting

### Backend won't start
- Make sure Python virtual environment is activated
- Check that port 8000 isn't in use: `lsof -i :8000`
- Verify all dependencies installed: `pip list`

### Frontend won't start
- Check that port 5173 isn't in use: `lsof -i :5173`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Verify Node.js version: `node --version` (should be 16+)

### Database errors
- Delete `sheepbooru.db` and run `python init_db.py` to reset
- Check file permissions in uploads folder

### CORS/Connection issues
- Ensure backend is running on port 8000
- Ensure frontend is running on port 5173
- Check browser console for error messages

## Production Deployment

For production deployment:
1. Set environment variables (especially for email/auth)
2. Use production ASGI server (e.g., Gunicorn)
3. Build frontend: `npm run build` → serves from `dist/`
4. Use proper database (PostgreSQL recommended)
5. Configure HTTPS/SSL
6. Set secure session cookies

See `ARCHITECTURE.md` for more details.

## Support

If you encounter issues:
1. Check `ARCHITECTURE.md` for technical details
2. Review backend console output for error messages
3. Check browser console (F12) for frontend errors
4. Ensure all prerequisites are installed correctly

---

**Happy coding!** 🎉
