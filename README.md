# LingoBridge

LingoBridge is an Expo mobile client with an Express and MongoDB API.

## Run locally

Prerequisites: Node.js 18 or later and a running MongoDB instance (local MongoDB or MongoDB Atlas).

1. Create the backend environment file:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

2. Edit `backend/.env`. Set `MONGODB_URI` to your MongoDB connection string and replace `JWT_SECRET` with a long, private value. `AI_API_KEY` is optional; without it, the API uses its built-in mock AI responses.

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

## Verification

The frontend has been verified with `npx expo export --platform web`; the backend JavaScript files pass `node --check`.
