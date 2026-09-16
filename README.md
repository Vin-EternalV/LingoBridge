# LingoBridge

LingoBridge is an Expo mobile client with an Express and MongoDB API.

## Run locally

Prerequisites: Node.js 18 or later and a running MongoDB instance (local MongoDB or MongoDB Atlas).

1. Create the backend environment file:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

2. Edit `backend/.env`. Set `MONGODB_URI` to your MongoDB connection string and replace `JWT_SECRET` with a long, private value. Set `GEMINI_API_KEY` to enable AI-powered practice and tutoring.

   The default provider is Gemini:

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   AI_PROVIDER=gemini
   GEMINI_MODEL=gemini-3.6-flash
   ```

   OpenAI is also supported with `AI_PROVIDER=openai`, `AI_API_KEY`, and `AI_MODEL`.

   The key stays in the backend only; it is never bundled into the Expo app.

3. In one terminal, start the API:

   ```powershell
   cd backend
   npm.cmd install
   npm.cmd run dev
   ```

4. In a second terminal, start the Expo app:

   ```powershell
   cd frontend
   npm.cmd install
   npm.cmd start
   ```

Open the app in an Android emulator, iOS simulator, Expo Go, or the web browser. The default API URL works for web and the Android emulator. For a physical phone, replace the development API host in `frontend/src/constants/config.js` with your computer's LAN IP address.

## Frontend API address

Copy `frontend/.env.example` to `frontend/.env` and set `EXPO_PUBLIC_API_URL` instead of changing source code:

```env
# Browser on the same computer
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# Phone or another device on the same Wi-Fi
# EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:5000/api

# Production
# EXPO_PUBLIC_API_URL=https://your-backend-domain.example/api
```

Restart Expo after changing the value. The backend listens on all local interfaces for LAN development. In production, set `CORS_ORIGINS` in `backend/.env` to the comma-separated list of permitted frontend origins.

## Verification

The frontend has been verified with `npx expo export --platform web`; the backend JavaScript files pass `node --check`.
