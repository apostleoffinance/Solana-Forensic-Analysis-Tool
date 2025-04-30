# Base Python image
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY src/ src/
COPY data/ data/

ARG GIT_COMMIT
ARG BUILD_TIMESTAMP
ENV GIT_COMMIT_HASH=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIMESTAMP

EXPOSE 5025

CMD ["python", "-u", "app.py"]
