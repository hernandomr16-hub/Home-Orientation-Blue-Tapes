# Blue Tape & Home Owner Manual

Aplicación web para gestión de proyectos de construcción, inspecciones "blue tape" y generación de manuales para propietarios.

## 🚀 Características

- **Proyectos**: Gestión de propiedades con áreas predefinidas
- **Walkthrough Wizard**: Creación paso a paso con captura de fotos
- **Issues**: Seguimiento de problemas con fotos antes/después
- **Contratistas**: Directorio con múltiples categorías de trabajo
- **Manual del Propietario**: Generación de PDF con información de la vivienda

## 🛠️ Tech Stack

- **Backend**: Python + FastAPI + SQLAlchemy
- **Frontend**: React + TypeScript + Material UI
- **Database**: PostgreSQL (SQLite para desarrollo)

## 📦 Despliegue en Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Variables de Entorno Requeridas

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://...  # Proporcionado por Railway
CORS_ORIGINS=https://your-frontend-url.railway.app
```

## 🏃 Desarrollo Local

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📱 Mobile Support

La aplicación es completamente responsiva y soporta captura de fotos desde dispositivos móviles.

## 📄 Licencia

MIT
