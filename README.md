# Resume-Coverletter-Optimizer

# Project Description

Resume Optimizer is a full-stack web application and Chrome extension designed to streamline the job application process for individuals seeking employment. This powerful tool empowers users to create, manage, and optimize their resumes, track job applications, and generate tailored cover letters using advanced AI capabilities powered by Google Gemini. Users can input their resume details, align them with specific job descriptions, and receive optimized content to enhance their chances of passing applicant tracking systems (ATS).  

The platform features a job tracker that helps users monitor application statuses, including applied, interview, and offer stages, with the ability to add and manage interview details. The integrated Chrome extension allows users to extract job descriptions directly from job postings, making it easier to tailor their applications in real-time.  

Built as a full-stack solution using React (Vite) for the frontend, Node.js and Express.js for the backend, and MongoDB for data storage, Resume Optimizer is deployed with the frontend on Vercel and the backend on Render. This setup ensures scalability, reliability, and seamless performance. With a centralized platform and seamless job tracking features, it helps job seekers organize their efforts and improve their application materials effectively.


# Tech Stack

* Frontend:
    * React: A JavaScript library for building dynamic user interfaces.
    * Vite: A fast build tool and development server for modern web projects.
    * React Router: For handling navigation and routing within the single-page application.
    * Axios: A promise-based HTTP client for making API requests.
    * Vercel: A platform for deploying and hosting the frontend with automatic scaling and zero-configuration deployment.

* Backend:
    * Node.js: A JavaScript runtime for building the server-side application.
    * Express.js: A web application framework for Node.js to handle routing and middleware.
    * MongoDB: A NoSQL database for storing user data, resumes, and job applications.
    * Mongoose: An ODM (Object Data Modeling) library for MongoDB and Node.js.
    * JSON Web Token (JWT): For secure authentication and authorization.
    * Render: A platform for deploying and hosting the backend with support for custom domains and automatic scaling.

* AI Integration:
    * Google Generative AI (Gemini): An AI model used for resume optimization and cover letter generation.

* Chrome Extension:
    * JavaScript: For implementing extension logic in background.js, content.js, and popup.js.
    * HTML: For creating the extension popup interface (popup.html).
    * CSS: For styling the extension popup (styles.css).
    * Chrome Extensions API: For interacting with browser features like tabs, content scripts, and background scripts.

* Other Tools:
    * dotenv: For managing environment variables securely.
    * cors: Middleware to enable Cross-Origin Resource Sharing for API requests.


# How to Use

# Clone the repository

   * Ensure you have "resume-optimizer-extension" folder locally

# Got to Chrome Extensions on your chrome browser
    1. chrome://extensions/
    2. In the top-right corner, toggle the Developer mode switch to On.
    3. On the Extensions page, click the Load unpacked button in the top left corner (appears after enabling Developer mode).
    4. In the file explorer window, navigate to the folder containing your extension files and open("resume-optimizer-extension")

# Now navigate to any linkedin or indeed job posting and use the extension
