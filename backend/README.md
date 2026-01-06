# Blue Tape Backend

## Setup
```bash
pip install -r requirements.txt
```

## Development
```bash
uvicorn app.main:app --reload
```

## Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`
- `SECRET_KEY`
- `SENDGRID_API_KEY` (optional)
- `TWILIO_*` (optional)
