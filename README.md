# Smart Student Clearance & Degree Issuance System

A MERN stack web app for university student clearance and digital degree issuance.

## Stack

- MongoDB + Mongoose
- Express.js + Node.js
- React + Vite
- JWT authentication and role-based access control

## Run

1. Install dependencies:

```bash
npm install
```

2. Copy backend environment settings:

```bash
copy backend\.env.example backend\.env
```

3. Configure MongoDB Atlas in `backend/.env`:

```bash
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster-host>/talentmap?appName=<app_name>
```

4. Seed demo data:

```bash
npm run seed
```

5. Start frontend and backend:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@university.edu` | `password123` |
| Library Staff | `library@university.edu` | `password123` |
| Accounts Staff | `accounts@university.edu` | `password123` |
| Hostel Staff | `hostel@university.edu` | `password123` |
| Administration Staff | `administration@university.edu` | `password123` |
| Admin | `admin@university.edu` | `password123` |
| Examination | `exam@university.edu` | `password123` |
