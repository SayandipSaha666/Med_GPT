FROM python:3.10-slim

WORKDIR /app

# Copy dependencies list and install
COPY prod-requirements.txt .
RUN pip install --no-cache-dir -r prod-requirements.txt

# Copy all python code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run the FastAPI application using uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
