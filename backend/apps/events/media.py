from django.core.files.storage import default_storage
from django.http import FileResponse, Http404


def event_image(request, filename, folder="events"):
    try:
        photo = default_storage.open(f"{folder}/{filename}", "rb")
    except FileNotFoundError:
        raise Http404
    response = FileResponse(photo, content_type="image/png" if filename.endswith(".png") else "image/jpeg")
    response["Cache-Control"] = "public, max-age=86400"
    response["Cross-Origin-Resource-Policy"] = "cross-origin"
    response["X-Content-Type-Options"] = "nosniff"
    return response
