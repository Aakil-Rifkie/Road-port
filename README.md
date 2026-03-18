RoadPort

A crowd-sourced road reporting platform that allows citizens of Colombo to report and track dangerous road conditions in real time. Users can pin hazards directly on an interactive map, view reports from others, and collectively vote to resolve issues once they've been fixed.

🌐 Live: [road-port.vercel.app](https://road-port.vercel.app)

---

Screenshots



![Login](screenshots/login.png) 
![Dashboard](screenshots/dashboard.png) 
![New Report](screenshots/new-report.png) 
![Report Details](screenshots/report-details.png)
![Admin Dashboard](screenshots/admin.png) 

---

Features

- Authentication** — Register and log in with JWT-based auth stored in HTTP-only cookies
- Interactive Map** — Click anywhere on the Colombo map to pin and submit a road hazard report
- Report Types** — Categorise reports as pothole, crack, flooding, noise, or smell
- Colour-coded Markers** — Each report type has a distinct colour for quick visual identification
- Marker Clustering** — Nearby markers group together at low zoom and expand at street level
- Heatmap Toggle** — Switch between marker view and a density heatmap showing hazard hotspots
- Search** — Geocoded search restricted to Colombo using the Nominatim API
- Report Details** — Click any marker to view the full report including image, description, and reporter
- Resolve Voting** — Users vote to mark a report as resolved; 5 votes removes it from the map
- Spam Protection** — One vote per user per report enforced at the database level
- Image Upload** — Attach photo evidence to reports, stored on Cloudinary
- Admin Dashboard** — Admins can view all active reports, filter by type, search, and manually resolve
- Role-based Access** — Admin and user roles enforced on both API routes and frontend routing
- Colombo Bounds** — Map is restricted to Colombo; pan and zoom limits prevent leaving the city
- Responsive** — Works on mobile and desktop

---

Tech Stack

**Frontend**
- React + TypeScript (Vite)
- Tailwind CSS
- React Leaflet + Leaflet.heat + react-leaflet-cluster
- Axios
- React Router

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL (via `pg`)
- JWT authentication with HTTP-only cookies
- Multer + Cloudinary for image uploads
- bcryptjs for password hashing

**Infrastructure**
- Frontend → Vercel
- Backend + Database → Railway
- Image Storage → Cloudinary

---

Local Setup

Prerequisites
- Node.js 18+
- PostgreSQL
- Cloudinary account

### Backend
```bash
cd backend
npm install
```


Create `backend/.env`:

```
PORT=3000
DATABASE_URL=your_local_postgres_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Run the schema in your local PostgreSQL instance, then:
```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

```bash
npm run dev
```

### Database Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fullname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('pothole', 'crack', 'noise', 'smell', 'flooding')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE report_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users` | Public | Register |
| POST | `/api/users/login` | Public | Login |
| POST | `/api/users/logout` | Public | Logout |
| GET | `/api/users/me` | Protected | Get current user |
| GET | `/api/reports` | Public | Get all active reports |
| POST | `/api/reports` | Protected | Create a report |
| PATCH | `/api/reports/:id/resolve` | Protected | Vote to resolve |
