# Job Application Tracker with AI-Powered Resume Optimization

# Overview
This is a comprehensive job application management system built to assist job seekers in tracking applications, optimizing resumes, and generating tailored cover letters using AI. The project consists of three integrated components.

# UI

<img width="330" height="300" alt="Image" src="https://github.com/user-attachments/assets/0c5d2647-5833-4f6f-aba4-c8cf251b6ab4" />
<img width="330" height="300" alt="Image" src="https://github.com/user-attachments/assets/c50897b8-ebe3-4c0d-acd8-26a19363e864" />
<img width="330" height="300" alt="Image" src="https://github.com/user-attachments/assets/1622472f-4a84-438f-bdd2-e538639e6c17" />
<img width="330" height="300" alt="Image" src="https://github.com/user-attachments/assets/7f9a0cba-0d89-45b2-9791-f08585e8c5dc" />
<img width="330" height="300" alt="Image" src="https://github.com/user-attachments/assets/c23817f7-9c3f-49e4-a8b9-0c60cf013a31" />
<img width="330" height="300" alt="Image" src="https://github.com/user-attachments/assets/5ab29479-9443-43d1-92a4-6e54298a90f1" />
<img width="500" height="400" alt="Image" src="https://github.com/user-attachments/assets/f3fb14cc-2963-450b-9d94-126483becae6" />
<img width="500" height="400" alt="Image" src="https://github.com/user-attachments/assets/370ed07b-6221-4cb6-94c5-5e883a6ec001" />

# The project was developed using a MERN stack (MongoDB, Express.js, React, Node.js)

* Backend: A Node.js and Express server with MongoDB for data persistence and AI integration.
* Frontend: A React-based single-page application for an intuitive user interface.
* Chrome Extension: A browser tool for extracting job postings from LinkedIn and Indeed, seamlessly integrating with the web app.

The application leverages Deepseek's AI model (via the Ollama service) to analyze job descriptions and optimize resumes, making it ATS-friendly and tailored to specific roles. This project focuses on full-stack development, 
API design, browser extension development, and AI integration—key skills for a software engineering role in AI-driven technologies.

# Features
* Job Tracking:
  * Add, edit, and delete job applications with statuses (e.g., Applied, Interview, Offer).
  * Extract job details (title, company, description) from LinkedIn and Indeed URLs via the Chrome extension or server-side scraping.
  * Filter and monitor application progress with a dashboard view.

* Resume Management:
  * Create, update, and delete multiple resumes with structured fields (skills, experience, education).
  * Store resumes in MongoDB, linked to user accounts.

* AI-Powered Optimization:
  * Optimize resumes by aligning content with job descriptions using AI (Ollama).
  * Generate professional, job-specific cover letters with AI assistance.

* Chrome Extension:
  * Detects job postings on LinkedIn and Indeed, extracts details, and sends them to the web app.
  * Provides a popup interface for login, signup, extraction, and optimization actions.

* User Authentication:
  * Secure user registration and login using JWT and bcrypt for password hashing.
 

# Tech Stack

# Backend
* Node.js & Express: RESTful API server.
* MongoDB (Mongoose): Database for storing users, jobs, and resumes.
* Ollama: AI service for resume optimization and cover letter generation.
* Axios & Cheerio: Web scraping for job extraction.
* JWT & bcrypt: Authentication and security.
* dotenv: Environment variable management.

# Frontend
* React: Single-page application with components for dashboard, resume builder, and job tracker.
* React Router: Client-side routing.
* Axios: API communication with the backend.
* CSS: Custom styling for a responsive UI.

# Chrome Extension
* Manifest V3: Modern Chrome extension architecture.
* Content Scripts: DOM manipulation for job extraction.
* Popup UI: HTML/CSS/JavaScript for user interaction.
* Chrome Storage: Local storage for user tokens and job data.

# Installation & Setup

# Prerequisites
* Node.js (v16+)
* MongoDB (local or Atlas)
* Ollama (running locally)
* Chrome browser (for extension)

# Steps
1. Clone Repository
2. Create ".env" file in "resume-optimizer-backend" folder with

```ini
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:1.5b
PORT=3000
```
3. Create ".env" file in "resume-optimizer-frontend" folder with

```ini
VITE_API_URL=http://localhost:3000
```
4. Start Ollama application

   * Pull deepseek model if needed
     ```ini
        ollama pull deepseek-coder
     ```

5. Go to "resume-optimizer-backend directory" and run

```ini
   cd resume-optimizer-backend
   npm install
   node server.js
```

6. In a separate terminal Go to "resume-optimizer-frontend directory" and run

```ini
   cd resume-optimizer-frontend
   npm install
   npm run dev
```

# Test Application

# Borwser App

 * Go to "http://localhost:5173/"

# Google Extension

 * Go to "chrome://extensions/"
 * Toggle "Developer mode" on top right
 * Click "Load unpacked" on top left
 * Select "resume-optimizer-extension" folder
 * Now you can test it by going to any job posting on linkedin or indeed and use the resume optimization service

