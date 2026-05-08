# Development Setup

## Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Django backend server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## Frontend Setup
1. Change into the frontend folder:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` contains the API base URL:
   ```text
   VITE_API_URL=http://localhost:8000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open the app at:
   ```text
   http://localhost:5173
   ```

## Notes
- The frontend uses `VITE_API_URL` to locate the Django backend.
- If mobile testing is required, make sure your device and laptop are on the same network and update backend CORS origins accordingly.
