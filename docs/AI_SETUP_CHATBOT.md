# AI Chatbot — Setup & Implementation Guide
> ACLCxp Support Assistant powered by Groq (Llama 3.1)
> Team Praxys — May 2026

---

## For Teammates — Quick Setup (After Pulling from Remote)

All the code is already in the repo. You only need to do three things:

### 1. Get your own free Groq API key

- Go to [https://console.groq.com](https://console.groq.com)
- Sign up for a free account
- Navigate to **API Keys** → **Create API Key**
- Copy the key — you only see it once

> Each developer needs their own key for their local machine.
> The free tier is more than enough for development and testing.

### 2. Add the key to your `.env`

Open `backend/.env` and add:

```env
GROQ_API_KEY=your_key_here
```

> Never commit your `.env` — it is already in `.gitignore`.

### 3. Install the Groq library

With your virtual environment active:

```bash
pip install -r requirements.txt
```

This installs `groq` along with everything else. If you want to install it alone:

```bash
pip install groq
```

### That's it — run the project normally

```bash
# Backend
cd backend
python manage.py runserver 0.0.0.0:8000

# Frontend (separate terminal)
cd frontend
npm run dev
```

Open the app, click the chat button at the bottom right, and type a message.

---

### Troubleshooting Quick Setup

| Problem | Fix |
|---------|-----|
| `AI service is not configured` | `GROQ_API_KEY` is missing from `.env` or Django wasn't restarted after adding it |
| `AI service unavailable` | Key is invalid or expired — generate a new one at console.groq.com |
| Chat button appears but no reply | Check that `VITE_API_URL` in frontend `.env` matches your backend address |
| Doesn't work on mobile | Run backend with `0.0.0.0:8000` and set `VITE_API_URL=http://192.168.x.x:8000` in frontend `.env` |
| `model_decommissioned` error | Update the `model=` value in `apps/ai/views.py` — see Model Reference below |

---

---

## Full Implementation Reference

This section documents how the chatbot was built — for capstone documentation, code review, and future development.

---

### Architecture

The chatbot is intentionally proxied through the Django backend. Calling the Groq API directly from React would expose the API key in the browser — anyone could open DevTools and steal it. The backend acts as a secure proxy.

```
User types message
    → SupportChat.tsx
        → POST /api/ai/chat/
            → apps/ai/views.py
                → Groq API (Llama 3.1 8B Instant)
                    → { "reply": "..." }
                        → Displayed in chat UI
```

---

### Files

| File | Role |
|------|------|
| `frontend/src/components/SupportChat.tsx` | Floating chat UI component |
| `backend/apps/ai/views.py` | Django view — receives message, calls Groq, returns reply |
| `backend/apps/ai/urls.py` | Registers the `/api/ai/chat/` endpoint |
| `backend/config/urls.py` | Includes `apps.ai.urls` under `api/ai/` |
| `backend/.env` | Stores `GROQ_API_KEY` locally (never committed) |

---

### Backend — `apps/ai/views.py`

The view handles validation, loads the API key via `python-decouple`, calls Groq, and returns the reply.

Key decisions:
- `@permission_classes([AllowAny])` — chat is available to unauthenticated users on the landing page
- Messages capped at **500 characters** server-side to prevent abuse
- `max_tokens=300` keeps responses concise and fast
- `temperature=0.5` balances consistency with natural language variation
- The system prompt strictly scopes the AI to ACLCxp topics

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from groq import Groq
from decouple import config

SYSTEM_PROMPT = """
You are the official support assistant for ACLCxp — a cloud-based event tracking system for ACLC College of Tacloban, Philippines. You were built by Team Praxys.

Your job is to help students, faculty, and staff with questions about the system. Be friendly, concise, and helpful. Always respond in plain text — no markdown, no bullet symbols, no asterisks.

Here is what you know about ACLCxp:

ABOUT THE SYSTEM:
ACLCxp digitalizes school-wide event management and attendance tracking. It replaces paper-based merit sheets with QR code attendance, live leaderboards, and digital house point computation.

USER ACCOUNTS:
- Students log in using their Student ID (numbers only) and password.
- To create an account, go to the Sign Up page and fill in your Student ID and email.
- If you forgot your password, use the Forgot Password link on the login page.
- You need an account to check in to events, view merit points, or see house standings.
- Without an account, you can only browse the landing page and public event info.

QR ATTENDANCE:
- Each event has a unique QR code.
- Students scan the QR code at the venue to log their attendance instantly.
- You must be registered and logged in before scanning.
- Do not share or misuse QR codes — fraudulent attendance is a violation of the Terms of Use.

HOUSE POINTS AND LEADERBOARD:
- House points are earned by attending and participating in school events.
- Points are tallied per house and shown on a live leaderboard.
- Your personal points history is visible in your dashboard after logging in.
- Points live in the system as approved, non-reversed transactions.

EVENTS:
- Published events appear on the landing page under Ongoing Events.
- After logging in, your dashboard shows upcoming events you can register for.

CONTACT:
- Address: 352 Real St. Tacloban City, Philippines 6500
- Facebook: facebook.com/ACLCTacCity
- Email: admissionoffice_aclctacloban@yahoo.com

BOUNDARIES:
- Only answer questions related to ACLCxp, ACLC College of Tacloban, or general student help.
- If asked about something unrelated, politely say you can only help with ACLCxp-related questions.
- Never make up features or policies that are not listed above.
- If unsure, direct the user to contact the school administrator.
""".strip()


@api_view(["POST"])
@permission_classes([AllowAny])
def chat(request):
    message = request.data.get("message", "").strip()

    if not message:
        return Response(
            {"error": "Message is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(message) > 500:
        return Response(
            {"error": "Message is too long."},
            status=status.HTTP_400_BAD_REQUEST
        )

    api_key = config("GROQ_API_KEY", default=None)
    if not api_key:
        return Response(
            {"error": "AI service is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
            max_tokens=300,
            temperature=0.5,
        )
        reply = completion.choices[0].message.content.strip()
        return Response({"reply": reply})

    except Exception as e:
        return Response(
            {"error": "AI service unavailable. Please try again."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
```

---

### Backend — `apps/ai/urls.py`

```python
from django.urls import path
from .views import chat

urlpatterns = [
    path("chat/", chat, name="ai-chat"),
]
```

---

### Backend — `config/urls.py`

The `ai` app is registered under `api/ai/`:

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/houses/', include('apps.houses.urls')),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/ai/', include('apps.ai.urls')),
]
```

---

### Frontend — `SupportChat.tsx`

The component is mounted globally in `App.tsx` above `<Routes>` so it appears on every page:

```tsx
function App() {
  return (
    <>
      <SupportChat />
      <Routes>
        ...
      </Routes>
    </>
  );
}
```

The `sendMessage` function posts to the backend and displays the reply:

```tsx
const sendMessage = async (text: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
    });
    const data = await res.json();
    const reply = data.reply || "Sorry, I couldn't get a response. Please try again.";
    // reply is added to messages state and rendered in the chat window
};
```

---

### Model Reference

Current model: `llama-3.1-8b-instant`

If this model gets decommissioned, check [https://console.groq.com/docs/deprecations](https://console.groq.com/docs/deprecations) and update the `model=` line in `apps/ai/views.py`.

| Model | Speed | Notes |
|-------|-------|-------|
| `llama-3.1-8b-instant` | Very fast | Current — best for chat |
| `llama-3.3-70b-versatile` | Slower | Better reasoning, higher token cost |
| `gemma2-9b-it` | Fast | Lightweight alternative |

---

### Security Notes

- API key is stored only in `.env` — never sent to the browser
- `.env` is in `.gitignore` — never committed to the repo
- Each developer uses their own key on their own machine
- The endpoint is public (`AllowAny`) intentionally — chat is available before login
- 500 character limit is enforced server-side
- System prompt prevents the AI from answering off-topic questions

---

### Planned Future Improvements

- [ ] Multi-turn conversation history — send previous messages for context
- [ ] Rate limiting per IP to prevent API abuse
- [ ] Admin dashboard — view common questions and usage analytics
- [ ] Personalized responses for logged-in users (use JWT to pull house, points)
- [ ] Face scanning integration for QR merit attendance check-in

---

*Last updated: May 2026 — Team Praxys*