# Blue Tape - Punch List & Home Owner Manual

Aplicación para gestión de punch lists en construcción con asignación a contratistas, seguimiento de issues por área, notificaciones automáticas, y generación de entregables.

## 🚀 Quick Start

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload
```

API disponible en: `http://localhost:8000/api/docs`

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

App disponible en: `http://localhost:5173`

---

## 📋 Features (MVP v1.0)

- ✅ **Gestión de Proyectos** - Crear/editar propiedades con dirección, unidad, fechas
- ✅ **Áreas por Proyecto** - Areas predefinidas + personalizadas
- ✅ **Issues (Punch Items)** - Fotos, categoría, prioridad, estado
- ✅ **Contratistas** - Base de datos master + asignación por proyecto
- ✅ **Workflow de Estados** - Open → Assigned → In Progress → Ready for Reinspect → Closed
- ✅ **Notificaciones** - Email/SMS al contratista (SendGrid/Twilio)
- ✅ **Reportes PDF** - Punch List exportable por área/trade/prioridad
- ✅ **Home Owner Manual** - Generador de manual en PDF

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Alembic |
| Frontend | React 18, TypeScript, Vite, MUI |
| Database | SQLite (dev), PostgreSQL (prod) |
| PDF | WeasyPrint |
| Notifications | SendGrid (email), Twilio (SMS) |

---

## 📁 Project Structure

```
blue-tape/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB connection
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── utils/           # Auth, helpers
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API calls
│   │   ├── contexts/        # React contexts
│   │   ├── types/           # TypeScript types
│   │   ├── theme.ts         # MUI theme
│   │   └── App.tsx          # Main app
│   └── package.json
└── README.md
```

---

## 🔐 Default User

Para desarrollo, registra un usuario admin:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","name":"Admin User","role":"admin"}'
```

---

## 📖 API Documentation

Swagger UI: `http://localhost:8000/api/docs`
ReDoc: `http://localhost:8000/api/redoc`

---

## 🎯 Roadmap

- [ ] Portal de contratistas (login + update status)
- [ ] Firma digital buyer/broker
- [ ] Markup de fotos
- [ ] Modo offline
- [ ] WhatsApp notifications
- [ ] IA para clasificar issues
