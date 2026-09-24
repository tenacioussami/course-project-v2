# Course Project Hub — MERN Stack Collaborative Course Project Website

A full-stack, dynamic, database-driven, role-based platform for managing a university course project as a team: tasks, members, chat, surveys, literature review, equipment, paper work, and project elements — all editable from the website with no code changes required.

## Features

- **Authentication**: JWT-based register/login, bcrypt password hashing. The first registered user automatically becomes Admin.
- **Roles**: `admin` (full management) and `member` (collaborative add/edit + own-task/message management).
- **Dashboard**: Live counts for members, tasks (by status), literature, equipment, documents, project progress, recent messages, upcoming deadlines.
- **Tasks**: Full CRUD, assignment, priority/status, search, filter, sort by deadline.
- **Members**: Profile cards, admin add/edit/delete/role-change, self profile edit.
- **Messages**: Simple chat-style board with delete-own (or admin delete-any), lightweight polling refresh.
- **Surveys**: Multiple choice / yes-no / rating / short-answer questions, response submission, aggregated results with bar visualizations.
- **Project section**: Overview, Literature Review (with PDF upload), Equipments (with image upload), Paper Work (with document upload) — all dynamically editable.
- **Elements**: Add/edit resources with an image and/or document.
- **About**: Course/instructor/university info, editable by admins.
- **File uploads**: Cloudinary-backed storage for PDFs, images, Office documents, with type + size validation.
- **Responsive UI**: Tailwind CSS, desktop dropdown / mobile collapsible navigation.

## Tech Stack

**Frontend**: React 18, Vite, React Router DOM, Tailwind CSS, Axios, Lucide icons
**Backend**: Node.js, Express, JWT, bcryptjs
**Database**: MongoDB + Mongoose
**File storage**: Cloudinary (via multer-storage-cloudinary)

## Folder Structure

```
course-project/
├── backend/
│   ├── config/db.js
│   ├── controllers/          # auth, users, tasks, messages, surveys, project, dashboard, crudFactory (literature/equipment/papers/elements)
│   ├── middleware/           # auth, role, error handling
│   ├── models/               # User, Task, Message, Survey, SurveyResponse, Project, Literature, Equipment, Paper, Element
│   ├── routes/
│   ├── utils/cloudinary.js
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── components/       # Navbar, Modal, ConfirmDialog, FileUpload, Loading, ProtectedRoute
        ├── pages/             # Home, Login, Register, Dashboard, Tasks, Members, Messages, Surveys,
        │                      # ProjectOverview, LiteratureReview, Equipments, PaperWork, Elements, About
        ├── context/AuthContext.jsx
        ├── services/api.js
        ├── layouts/DashboardLayout.jsx
        ├── App.jsx
        └── main.jsx
```

## MongoDB Setup

1. Install MongoDB locally, or create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Copy the connection string into `backend/.env` as `MONGODB_URI`.
   - Local: `mongodb://localhost:27017/course-project`
   - Atlas: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/course-project`

## Cloud Storage Setup (Cloudinary)

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From your dashboard, copy `Cloud Name`, `API Key`, and `API Secret` into `backend/.env`.
3. The upload utility (`backend/utils/cloudinary.js`) automatically routes images to `resource_type: image` and documents (PDF/DOC/PPT) to `resource_type: raw`.
4. To swap providers later (e.g. AWS S3), only `backend/utils/cloudinary.js` needs to change — every route/controller uses the same `upload.single()` / `upload.fields()` middleware contract.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```
MONGODB_URI=
JWT_SECRET=
PORT=5000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173
```

Never commit `.env` — it's already covered by best practice; add a `.gitignore` entry for it if you initialize git.

## Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Running the App

**Backend** (from `backend/`):
```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```
Runs on `http://localhost:5000`.

**Frontend** (from `frontend/`):
```bash
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api` calls to the backend (see `vite.config.js`).

## Authentication Flow

1. `POST /api/auth/register` — creates a user (bcrypt-hashed password). The very first user in the database becomes `admin`; everyone after that registers as `member` by default.
2. `POST /api/auth/login` — verifies credentials, returns a JWT (`{ token }`) valid for 30 days.
3. Frontend stores the token in `localStorage` and attaches it via an Axios request interceptor (`Authorization: Bearer <token>`).
4. `GET /api/auth/me` — used on app load to re-hydrate the session; a 401 response clears the stored session and redirects to `/login`.
5. Protected backend routes use the `protect` middleware (verifies JWT, loads `req.user`), and admin-only routes add `authorize('admin')`.

## API Documentation (summary)

| Resource | Base route | Notes |
|---|---|---|
| Auth | `/api/auth` | `register`, `login`, `me` |
| Users/Members | `/api/users`, `/api/members` | Same underlying collection; members list is for the Members page |
| Tasks | `/api/tasks` | Filter via `?status=&priority=&assignedTo=&search=&sort=deadline` |
| Messages | `/api/messages` | Chat-style; delete restricted to own message or admin |
| Surveys | `/api/surveys` | `POST /:id/responses` to submit, `GET /:id/results` for aggregated results |
| Project | `/api/project` | Singleton document — Overview + About fields |
| Literature | `/api/literature` | Multipart `pdf` field for uploads; `?search=&year=` |
| Equipment | `/api/equipment` | Multipart `image` field; `?search=&category=` |
| Papers | `/api/papers` | Multipart `file` field; `?status=` |
| Elements | `/api/elements` | Multipart `image` and/or `file` fields; `?search=&category=` |
| Dashboard | `/api/dashboard` | Aggregated counts + recent activity |

All list/detail/create/update routes require a valid JWT except `GET /api/project` (public project showcase on the Home page). Delete routes on Members, Tasks, Surveys, and all Project-section content are restricted to `admin`.

## Deployment Notes

- **Backend**: Deploy to Render / Railway / Fly.io / a VPS. Set the same environment variables there. Make sure `CLIENT_URL` matches your deployed frontend origin (for CORS).
- **Frontend**: Deploy to Vercel / Netlify. Set an environment variable or update `services/api.js` to point `baseURL` at your deployed backend URL (the Vite dev proxy only works locally).
- **MongoDB**: Use Atlas in production; whitelist your backend host's IP (or `0.0.0.0/0` for simplicity in a course project).
- **Cloudinary**: Free tier is sufficient for a course project; no additional configuration needed once env vars are set.

## Extending

- Add more roles by extending the `role` enum in `models/User.js` and updating `authorize()` checks.
- Add real-time chat via Socket.IO by wrapping `server.js` with an HTTP server and broadcasting on new `Message` creation (the polling-based `Messages.jsx` page is a placeholder for that upgrade).
- Add pagination to list endpoints (`Task.find().skip().limit()`) if content volume grows.
