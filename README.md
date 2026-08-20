# Dockuy

A clean, fast, and lightweight Docker management web UI. No database, no complex setup, just single-password access directly connected to your Docker daemon.

---

## Why Dockuy?

- **Zero Heavy Setup**: Connects straight to `/var/run/docker.sock` or Windows named pipe. No database required.
- **Fast & Minimal**: Clean white & blue interface with instant load times (< 50MB RAM footprint).
- **Single Password Auth**: Protect your dashboard with a secure bcrypt password hash and JWT session cookies.
- **Cross-Platform**: Automatically detects real OS, Kernel, CPU, and Docker specifications on Linux, macOS, and Windows.

---

## Features

- **Dashboard**: Live container metrics, memory/CPU overview, and host system specs.
- **Container Management**: Create, start, stop, restart, edit, and recreate containers with customizable port mappings, environment variables, volume mounts, restart policies, and **Memory/RAM resource limits**.
- **Image Management**: Browse local images, **build new images from source directories (Dockerfile)**, pull from registries (Docker Hub), manage tags, inspect specifications, and delete unused images.
- **Security**: Password protection, rate limiting, and secure HTTP-only cookies.

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/aspeyredfellow/Dockuy.git
cd Dockuy
npm install
```

### 2. Generate Password Hash

Generate a secure bcrypt hash for your login password:

```bash
npm run hash "YourPasswordHere"
```

Copy the output hash string (e.g. `$2b$10$...`).

### 3. Setup Environment (.env)

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=production
PASSWORD_HASH="$2b$10$YourGeneratedHashHere"
JWT_SECRET="your-random-secret-key"
DOCKER_HOST="/var/run/docker.sock"
```

> Windows Note: If running Docker Desktop natively on Windows, set `DOCKER_HOST="//./pipe/docker_engine"`.

### 4. Run

```bash
npm start
```

For development mode (with auto-reload):

```bash
npm run dev
```

Open `http://localhost:3000` in your browser and enter your password.

---

## Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Server listening port |
| `PASSWORD_HASH` | *Required* | Bcrypt hash of your login password |
| `JWT_SECRET` | `dockuy-super-secret-key-change-this` | Secret key for JWT session tokens |
| `DOCKER_HOST` | `/var/run/docker.sock` | Path to Docker socket or TCP address |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `RATE_LIMIT_MAX` | `100` | Max API requests per 15 minutes |
| `LOGIN_RATE_LIMIT_MAX` | `5` | Max login attempts per 15 minutes |

---

## Project Structure

```
Dockuy/
├── src/
│   ├── config/          # Environment configuration
│   ├── controllers/     # Route logic (auth, containers, images)
│   ├── middleware/      # Auth & rate limit guards
│   ├── public/          # Styles (Tailwind + CSS) and client JS
│   ├── routes/          # Express route definitions
│   ├── services/        # Dockerode service wrapper
│   ├── views/           # EJS views and partials
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── package.json
└── README.md
```

---

## License

MIT License. Open source and free to use.
