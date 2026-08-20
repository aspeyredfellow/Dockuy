# Dockuy

A lightweight, clean, and fast web management interface for Docker. Dockuy allows you to manage containers and images directly from your browser using a simple single-password authentication system.

---

## Overview

Dockuy is built for developers and system administrators who want a simple Docker dashboard without heavy databases or complex multi-user setups. It communicates directly with your Docker daemon via Unix socket or Windows named pipe.

---

## Features

### 1. Dashboard and Host Information
- Real-time overview of total containers, active running containers, and stopped containers.
- Total local Docker images count.
- System CPU cores and total allocated host memory.
- Automatic detection of host Operating System, Kernel version, CPU Architecture, Docker Engine version, and Storage Driver.
- Quick action shortcuts to manage containers and images.

### 2. Container Management
- View all containers in a clean table (desktop) or mobile-friendly card layout.
- Container controls: Start, Stop, Restart, and Delete.
- Create new containers with custom port mappings, environment variables, volume mounts, and restart policies.
- Quick preset buttons for common images (Nginx, Redis, MySQL, PostgreSQL, MongoDB, Node.js).
- Edit and recreate existing containers with updated parameters.

### 3. Image Management
- List all local Docker images with repository names, image tags, image IDs, and disk size.
- Delete unused or old Docker images with confirmation dialogs.

### 4. Security and Access Control
- Single master password authentication with bcrypt hashing.
- Secure JWT-based session management stored in HTTP-only cookies.
- Rate limiting protection on login endpoints and general API requests.
- Security headers enabled using Helmet middleware.

---

## Prerequisites

Before running Dockuy, ensure you have the following installed on your host system:

- Node.js (version 18.x or higher recommended)
- npm (version 9.x or higher)
- Docker Engine / Docker Desktop (running and accessible)

---

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Dockuy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Password Hash
Dockuy uses a bcrypt password hash for authentication. Generate a hash for your password using the built-in script:

```bash
npm run hash "YourSecurePassword"
```

Copy the generated hash output (for example: `$2b$10$wK8gJ...`).

### 4. Configure Environment Variables
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

If `.env.example` is not present, create a `.env` file with the following variables:

```env
PORT=3000
NODE_ENV=production
PASSWORD_HASH=$2b$10$YourGeneratedBcryptHashHere
JWT_SECRET=your-random-long-secret-string
DOCKER_HOST=/var/run/docker.sock
```

> Note for Windows users: If you are running Docker Desktop on Windows natively without WSL socket forwarding, set `DOCKER_HOST=//./pipe/docker_engine`.

### 5. Start the Application

For production mode:
```bash
npm start
```

For development mode (with auto-reload):
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

Enter your password to unlock the dashboard.

---

## Configuration Options

All configuration settings are controlled via environment variables:

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | HTTP port for the web server | `3000` |
| `NODE_ENV` | Application environment (`development` or `production`) | `development` |
| `PASSWORD_HASH` | Bcrypt hash of your master login password | Required |
| `JWT_SECRET` | Secret key used to sign JWT authentication tokens | `dockuy-super-secret-key-change-this` |
| `DOCKER_HOST` | Path to Docker daemon socket or TCP address | `/var/run/docker.sock` |
| `RATE_LIMIT_WINDOW_MS` | Time window for rate limiting in milliseconds | `900000` (15 minutes) |
| `RATE_LIMIT_MAX` | Maximum API requests allowed per time window | `100` |
| `LOGIN_RATE_LIMIT_MAX` | Maximum login attempts allowed per time window | `5` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

---

## Project Structure

```
Dockuy/
├── src/
│   ├── config/
│   │   └── index.js              # Centralized environment configuration
│   ├── controllers/
│   │   ├── authController.js     # Login and session handling
│   │   ├── containerController.js# Container view and API controllers
│   │   └── imageController.js    # Image view and API controllers
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication verification
│   │   └── rateLimit.js          # Rate limiting middleware
│   ├── public/
│   │   ├── css/
│   │   │   ├── style.css         # Application custom styles and theme
│   │   │   └── tailwind.min.css  # Tailwind CSS framework
│   │   └── js/
│   │       └── main.js           # Client UI scripts and dialogs
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── containers.js         # Container routes
│   │   ├── images.js             # Image routes
│   │   └── system.js             # System info and healthcheck routes
│   ├── services/
│   │   └── docker.js             # Dockerode wrapper service
│   ├── views/
│   │   ├── partials/
│   │   │   ├── footer.ejs        # Footer partial
│   │   │   ├── header.ejs        # Header and navigation partial
│   │   │   └── sidebar.ejs       # Sidebar navigation partial
│   │   ├── containers.ejs        # Container management view
│   │   ├── dashboard.ejs         # System overview dashboard view
│   │   ├── error.ejs             # Error page view
│   │   ├── images.ejs            # Image management view
│   │   └── login.ejs             # Login view
│   ├── app.js                    # Express application setup
│   └── server.js                 # Server entry point
├── package.json                  # Node.js dependencies and scripts
└── README.md                     # Project documentation
```

---

## API Endpoints

### Authentication
- `GET /login` : Render login page
- `POST /api/login` : Authenticate user with password and issue JWT cookie
- `GET /logout` : Clear authentication session cookie

### System
- `GET /api/system/info` : Return Docker daemon metrics and host system specifications
- `GET /api/system/health` : Basic service healthcheck endpoint

### Containers
- `GET /containers` : Render container management page
- `GET /containers/api/:id` : Fetch detailed configuration for a specific container
- `POST /containers/api/create` : Create and start a new container
- `POST /containers/api/:id/update` : Update and recreate an existing container
- `POST /containers/api/:id/:action` : Perform action on container (`start`, `stop`, `restart`)
- `DELETE /containers/api/:id` : Remove container from host

### Images
- `GET /images` : Render image management page
- `DELETE /images/api/:id` : Remove image from host

---

## Troubleshooting

### 1. Docker Daemon Connection Error
If you see an error stating "Failed to connect to Docker daemon":
- Make sure Docker is running (`docker ps` works in terminal).
- Verify that your user account has permission to read `/var/run/docker.sock`. On Linux, add your user to the docker group: `sudo usermod -aG docker $USER`.
- If using Docker Desktop on Windows, ensure the named pipe `//./pipe/docker_engine` is active or WSL integration is turned on.

### 2. Login Failed
- Ensure `PASSWORD_HASH` in `.env` is wrapped in single or double quotes if it contains special characters like `$`.
- Regenerate the password hash using `npm run hash "YourPassword"`.

---

## License

This project is open-source software licensed under the MIT License.
