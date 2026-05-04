<div align="center">
  <h1>🚀 Applyd</h1>
  <p><strong>The AI-Powered Job Application & Resume Optimization Platform</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#environment-variables">Environment Setup</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 💡 About Applyd

**Applyd** is a modern, full-stack SaaS platform designed to supercharge the job search process. By leveraging the power of AI (Google Gemini), Applyd analyzes and tailors resumes for specific job descriptions, tracks application lifecycles, and provides actionable insights through a beautiful, responsive dashboard.

Whether you're managing dozens of ongoing applications or looking to perfectly align your resume with your dream role, Applyd provides the tools to organize, optimize, and succeed.

## ✨ Key Features

- **🤖 AI-Powered Resume Optimization:** Automatically extract keywords and tailor your resume to match specific job descriptions using Google Gemini AI.
- **📊 Application Tracking Dashboard:** A centralized, visual kanban-style and card-based interface to track the status of all your applications (Applied, Interviewing, Offered, Rejected).
- **🔒 Secure Authentication:** Production-ready JWT authentication and session management powered by Supabase Auth.
- **💳 Built-in SaaS Billing:** Seamless credit purchases and tier upgrades integrated with Stripe.
- **🎨 Premium UI/UX:** A stunning, highly responsive design system built with Tailwind CSS, featuring dark mode support, glassmorphism, and smooth micro-animations.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (Custom Design System)
- **State & Data Fetching:** React Hooks, Axios
- **Routing:** React Router DOM

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **AI Integration:** Google Generative AI (Gemini)
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Payments:** Stripe integration for credit/subscription management
- **Server:** Uvicorn

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- A **Supabase** account (for Database & Auth)
- A **Google Gemini API Key**
- A **Stripe Account** (for testing billing/credits)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/applyd.git
cd applyd
```

### 2. Frontend Setup

Install the Node dependencies and start the Vite development server:

```bash
# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```
*The frontend will run at `http://localhost:5173`.*

### 3. Backend Setup

Open a new terminal window, navigate to the `backend` directory, set up your Python environment, and start FastAPI:

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```
*The backend API will run at `http://localhost:8000`.*
*You can access the interactive API docs at `http://localhost:8000/docs`.*

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables. 

### Frontend (`.env` in the root directory)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### Backend (`backend/.env`)
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key

# Payment/Stripe Integration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Environment
ENVIRONMENT=development
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  <i>Built with ❤️ by the Applyd Team</i>
</div>
