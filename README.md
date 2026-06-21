# TalentMap - Smart Recommender
https://talent--map.vercel.app/

TalentMap is a MERN stack web application designed to help candidates map their career paths by discovering their skill gaps and receiving dynamic, AI-matched job opportunities based on their profile, skills, and interests.

## Features

- **Candidate Dashboard:** Register, manage skills and interests, and view personalized job recommendations with match scores.
- **Career Roadmaps:** Generate step-by-step learning paths to acquire missing skills and qualify for target roles.
- **Job Matcher:** A smart recommendation engine that ranks job openings against a candidate's profile.
- **Content Management:** Staff can manage job listings, skill taxonomies, and curated learning resources (courses and certifications).
- **Analytics & Admin Panel:** Administrators can manage user roles, view platform analytics, and monitor audit logs.
- **System Configuration:** Super Admins can adjust the weights of the recommendation engine (e.g., Skill Weight vs. Interest Weight).

## Technology Stack

- **Database:** MongoDB Atlas + Mongoose
- **Backend:** Node.js + Express.js
- **Frontend:** React + Vite
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)
- **Deployment:** Vercel ready (Serverless APIs)

## Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Set up your `backend/.env` file. Ensure that your MongoDB URI specifies the `talentmap` database:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/talentmap?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_here
   CLIENT_URL=http://localhost:5173
   ```

3. **Seed the Demo Database:**
   Populate the database with sample skills, learning resources, jobs, and users:
   ```bash
   npm run seed
   ```

4. **Run the Application:**
   Start both the frontend and backend development servers concurrently:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Demo Accounts

You can log in using the following accounts after running the seed command (Password for all: `password123`):

| Role | Email | Access Level |
| --- | --- | --- |
| Candidate | `student@talentmap.edu` | Manage profile, view job matches, build roadmaps. |
| Content Manager | `manager@talentmap.edu` | Manage job listings, skill taxonomies, and learning resources. |
| Administrator | `admin@talentmap.edu` | Access analytics, manage user roles, view audit logs. |
| Super Admin | `superadmin@talentmap.edu` | Adjust system config and recommendation engine weights. |
