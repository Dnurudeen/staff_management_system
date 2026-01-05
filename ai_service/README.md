# AI Suggestion Service

A FastAPI-based intelligent suggestion service for the Staff Management System.

## Features

-   **Description Suggestions**: Automatically generates descriptions for tasks, meetings, and departments based on titles
-   **Inline Completions**: Real-time text completion suggestions as users type
-   **UK English**: All suggestions use British English spelling and phrasing
-   **Context-Aware**: Considers additional context like priority, duration, etc.

## Setup

1. Create a virtual environment:

```bash
cd ai_service
python -m venv venv
```

2. Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the service:

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

### Health Check

```
GET /
```

### Description Suggestion

```
POST /api/suggest/description
Content-Type: application/json

{
    "title": "Review quarterly report",
    "type": "task",
    "context": {
        "priority": "high"
    }
}
```

### Inline Completion

```
POST /api/suggest/completion
Content-Type: application/json

{
    "text": "Please ensure",
    "field_type": "description",
    "context_type": "task"
}
```

### Alternative Suggestions

```
POST /api/suggest/alternatives
Content-Type: application/json

{
    "title": "Engineering Team",
    "type": "department"
}
```

## Response Examples

### Description Response

```json
{
    "suggestion": "Review and provide comprehensive feedback on quarterly report...",
    "alternatives": ["...", "..."],
    "confidence": 0.85
}
```

### Completion Response

```json
{
    "completion": " all stakeholders are",
    "full_text": "Please ensure all stakeholders are",
    "confidence": 0.9
}
```

## Integration

The service runs on port 8001 by default and accepts requests from the Laravel/React frontend.

Add the AI service URL to your `.env` file:

```
VITE_AI_SERVICE_URL=http://localhost:8001
```

## Production Deployment (DigitalOcean Droplet)

### 1. Install Python and Dependencies on your Droplet

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Install Python 3 and pip
sudo apt update
sudo apt install python3 python3-pip python3-venv -y

# Navigate to your project
cd /var/www/your-project/ai_service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Create a Systemd Service

Create a service file to run the AI service in the background:

```bash
sudo nano /etc/systemd/system/ai-service.service
```

Add the following content:

```ini
[Unit]
Description=Staff Management AI Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/your-project/ai_service
Environment="PATH=/var/www/your-project/ai_service/venv/bin"
ExecStart=/var/www/your-project/ai_service/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-service
sudo systemctl start ai-service

# Check status
sudo systemctl status ai-service

# View logs
sudo journalctl -u ai-service -f
```

### 3. Configure Nginx Reverse Proxy (Recommended)

Add the AI service to your Nginx configuration:

```nginx
# In your server block, add:
location /ai-api/ {
    proxy_pass http://127.0.0.1:8001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Restart Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Update Frontend Environment

On your production server, update the `.env` file:

```bash
# If using Nginx reverse proxy (recommended)
VITE_AI_SERVICE_URL=https://yourdomain.com/ai-api

# Or if exposing port directly (not recommended for production)
VITE_AI_SERVICE_URL=http://your-droplet-ip:8001
```

### 5. Rebuild Frontend Assets

After updating the `.env` file, rebuild the frontend:

```bash
npm run build
```

### 6. Configure Firewall (if not using Nginx proxy)

If you need direct access to port 8001:

```bash
sudo ufw allow 8001/tcp
```

### 7. Update CORS Origins (if needed)

Edit `main.py` to include your production domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "https://yourdomain.com",
        "https://www.yourdomain.com"
    ],
    # ...
)
```

### Troubleshooting

1. **AI button not showing**: Check browser console for CORS errors
2. **Service not starting**: Check logs with `sudo journalctl -u ai-service -f`
3. **502 Bad Gateway**: Ensure the AI service is running on the correct port
4. **SSL Issues**: Use Nginx proxy with your existing SSL certificate
