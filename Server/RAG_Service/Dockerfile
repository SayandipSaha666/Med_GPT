FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY prod-requirements.txt ./prod-requirements.txt
RUN pip install --no-cache-dir -r prod-requirements.txt

COPY . .

# Assumes app.py exports a FastAPI instance named `app`.
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
