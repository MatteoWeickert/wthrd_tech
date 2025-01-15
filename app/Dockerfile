# Start with a base Python image
FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Copy your application files into the container
COPY . /app

# Install dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose FastAPI on port 8000
EXPOSE 8000

# Start FastAPI using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

