from django.shortcuts import render
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