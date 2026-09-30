# Future Infrastructure & GCP Roadmap

## 1. Enterprise Hosting (Cloud Run)
- **Goal:** Move Next.js SSR deployment from DreamHost SFTP to an enterprise containerized pipeline.
- **How:** Build a Dockerfile, push to Google Artifact Registry, and deploy to Cloud Run (scales to zero, covered by Always Free tier).

## 2. Serverless Database (Firestore)
- **Goal:** Replace local-only Zustand `persist` storage with a real backend.
- **How:** Use Firebase/Firestore to create user accounts, save bookmarked SeatGeek events to the cloud, and allow multi-device syncing.

## 3. Edge-Hosted DesignOps Tools (Cloud Run)
- **Goal:** Decouple custom MCP tools from the local machine.
- **How:** Containerize the `designops-mcp` Node server and deploy to Cloud Run so IDEs on any machine can securely access the token and Tailwind audit tools via URL.

## 4. Home Lab Secure Gateway (Compute Engine)
- **Goal:** Secure remote access to the home network (*arr stack, Jellyfin, Pi-hole) without exposing router ports.
- **How:** Spin up a lightweight Debian VM (e2-micro) on Compute Engine to act as a Wireguard VPN node or secure reverse proxy.
