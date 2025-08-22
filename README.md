# Droplater Project README

## 🚀 How to Run with Docker Compose

1. **Build images**

   ```bash
   DOCKER_BUILDKIT=0 docker compose build
   ```
2. **Start all services**

   ```bash
   DOCKER_BUILDKIT=0 docker compose up -d
   ```
3. **Check running containers**

   ```bash
   docker compose ps
   ```
4. **View logs for a specific service**

   ```bash
   docker compose logs -f api
   ```
5. **Stop all services**

   ```bash
   docker compose down
   ```

---

## 📬 Example Curl Commands

### Test API Health (GET)

```bash
curl http://localhost:5000/
```

## ⚙️ Environment Variables

The application loads environment variables from the `.env` file at the project root.
Below is an example configuration:

```env
# .env
PORT=5000
MONGO_URI=mongodb://localhost:27017/droplater
REDIS_URL=redis://localhost:6379
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Inside Docker, these values are overridden in `docker-compose.yml` to use the appropriate service names:

```yaml
MONGO_URI=mongodb://mongo:27017/droplater
REDIS_HOST=redis
REDIS_PORT=6379
```

---

💡 **Tip:** Use `docker compose logs -f <service>` to debug each individual service (api, worker, sink, admin).

## 📬 Example API Requests

### Create a New Note

```bash
curl -X POST http://localhost:5000/api/notes \
-H "Content-Type: application/json" \
-d '{
  "title": "Example Note",
  "body": "This is a test note",
  "webhookUrl": "http://localhost:4000/sink",
  "releaseAt": "2025-12-01T10:00:00.000Z"
}'
```

### Get Notes

```bash
# All notes (page 1)
curl "http://localhost:5000/api/notes"

# Only failed notes (page 2)
curl "http://localhost:5000/api/notes?status=failed&page=2"
```

### Replay Failed Note

```bash
curl -X POST http://localhost:5000/api/notes/<NOTE_ID>/replay
```

### Health Check (requires token)

```bash
curl -H "Authorization: Bearer droplater&&notes&&assignment" http://localhost:5000/health
```
