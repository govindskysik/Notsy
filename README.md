# NOTSY

Smart study workspace with notebooks, resources, flashcards, and AI-assisted chat.

## Highlights
- AI-assisted chat with context from your uploaded resources
- Notebooks and topics to organize study content
- Auto-generated flashcards and revision notes
- PDF uploads and resource management
- Graph-based topic exploration

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS + DaisyUI
- React Router
- Axios
- Graphology + Sigma (graph visualizations)

### Backend
- Node.js (Express)
- MongoDB (Mongoose)
- Multer (file uploads)
- OpenAI API client
- Puppeteer (resource extraction)

### AI/ML Service
- Python (Django + DRF)
- SQLite (dev)
- LangChain / OpenAI SDK

## Architecture

### Components
- **Web Client** in [Frontend/](Frontend/)
  - UI, routing, auth context, API clients
- **API Server** in [Backend/](Backend/)
  - Auth, notebooks, topics, chat, resources, uploads
  - Orchestrates AI calls and file processing
- **AI Service** in [notsy/](notsy/)
  - Embeddings, dataset utilities, AI endpoints

### Data Flow
1. User interacts with the Web Client.
2. Web Client calls the API Server.
3. API Server reads/writes to MongoDB and serves uploads.
4. For AI features, the API Server calls the AI Service and OpenAI.
5. Responses are returned to the Web Client.

### High-Level Diagram
```mermaid
flowchart LR
  U[User] --> WC[Web Client (React)]
  WC --> API[API Server (Express)]
  API --> DB[(MongoDB)]
  API --> AI[AI Service (Django)]
  API --> OAI[OpenAI API]
  AI --> API
  API --> WC
```

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.10+ and pip
- MongoDB instance

### 1) Backend (Express API)
1. Install dependencies:
   - cd Backend
   - npm install
2. Create a .env file in Backend/ with:
   - MONGO_URI=your_mongodb_connection_string
   - JWT_SECRET=your_jwt_secret
   - JWT_LIFETIME=1d
   - OPENAI_ORG_ID=your_openai_org_id
   - OPENAI_PROJECT_ID=your_openai_project_id
   - OPENAI_API_KEY=your_openai_api_key
3. Start the server:
   - node app.js

### 2) AI Service (Django)
1. Install dependencies:
   - cd notsy
   - python -m venv .venv
   - .venv\Scripts\activate
   - pip install -r requirements.txt
2. Start the server:
   - python manage.py runserver 8000

### 3) Frontend (Vite)
1. Install dependencies:
   - cd Frontend
   - npm install
2. Start the dev server:
   - npm run dev

## Environment Notes
- The API server expects the AI Service at http://127.0.0.1:8000.
- The Web Client uses http://localhost:3000/notsy as its API base URL.
- CORS is configured to allow http://localhost:5173.
- Uploaded files are served from /uploads on the API server.

## Repository Structure
- [Frontend/](Frontend/) — UI and client logic
- [Backend/](Backend/) — REST API and integrations
- [Backend/uploads/](Backend/uploads/) — uploaded files
- [notsy/](notsy/) — Django AI service


