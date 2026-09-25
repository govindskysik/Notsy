# Notsy

Notsy is a connected study workspace for collecting material, understanding it, and seeing how it fits together. Create notebooks, organise topics, attach PDFs or videos, then use the built-in study tools to chat with a resource, generate notes, make flashcards, and explore your knowledge map.

## What you can do

- Create notebooks and group related topics inside them.
- Add PDF documents and YouTube videos as topic resources.
- Open PDFs directly from the study workspace.
- Ask questions about a resource in the study chat.
- Generate revision notes and flashcards from your material.
- Explore notebooks, topics, and resources in an interactive constellation map.
- Move around the map with pan, zoom, selection, and cluster dragging.

## Tech stack

| Area | Tools |
| --- | --- |
| Client | React, Vite, React Router, Axios, Tailwind CSS, DaisyUI |
| API | Node.js, Express, Mongoose, JWT, Multer |
| Data | MongoDB |
| Resource processing | Puppeteer, YouTube transcript tools, PDF libraries |
| AI service | Django/DRF, LangChain, OpenAI-compatible APIs |

## Project structure

```text
Notsy/
|- Frontend/           # React + Vite application
|- Backend/            # Express API, authentication, uploads, resources
|- Backend/uploads/    # Uploaded PDF files
`- notsy/              # Python AI service
```

## Run locally

### Prerequisites

- Node.js 18 or later and npm
- Python 3.10 or later (for AI-powered ingestion and generated notes)
- A MongoDB database (local MongoDB or MongoDB Atlas)

### 1. Configure the API

Install the backend dependencies:

```powershell
cd Backend
npm install
```

Create `Backend/.env` and add your own values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
JWT_LIFETIME=1d
OPENAI_API_KEY=your_api_key
OPENAI_ORG_ID=your_organization_id
OPENAI_PROJECT_ID=your_project_id
```

Start the API:

```powershell
npm run dev
```

The API runs on `http://localhost:3000` and serves uploads from `/uploads`.

### 2. Start the AI service

The API expects the AI service at `http://127.0.0.1:8000` for document ingestion and note generation.

```powershell
cd notsy
python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python manage.py runserver 8000
```

### 3. Start the client

In another terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`).

## Useful scripts

| Location | Command | Purpose |
| --- | --- | --- |
| `Frontend` | `npm run dev` | Run the development client |
| `Frontend` | `npm run build` | Create a production client build |
| `Frontend` | `npm run lint` | Check client code with ESLint |
| `Backend` | `npm run dev` | Run the API with automatic restarts |
| `Backend` | `npm start` | Run the API normally |

## Configuration notes

- The frontend sends API requests to `http://localhost:3000/notsy`.
- CORS is configured for the local Vite client at `http://localhost:5173`.
- Never commit `.env` files or API keys.
- For MongoDB Atlas, add your current IP address to the Atlas network access list. A connection error such as `ReplicaSetNoPrimary` or a TLS alert often means Atlas access, DNS, or network rules need checking.

## Product flow

1. Sign up and create a notebook.
2. Add topics to keep ideas focused.
3. Attach PDFs or videos as study resources.
4. Open a resource to chat, create flashcards, or generate notes.
5. Use the knowledge map to see and navigate the relationships between your work.

---

Built for quieter, more connected learning.
