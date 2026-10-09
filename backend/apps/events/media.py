from io import BytesIO
from PIL import Image, ImageOps, UnidentifiedImageError
from django.core.cache import caches
from django.core.files.storage import default_storage
from django.http import FileResponse, Http404, HttpResponse, HttpResponseBadRequest
from django.utils.cache import get_conditional_response

THUMBNAIL_WIDTHS = (320, 640, 1280)


def thumbnail(photo, width):
    with Image.open(photo) as source:
        image = ImageOps.exif_transpose(source)
        image.thumbnail((width, width * 4), Image.Resampling.LANCZOS)
        output = BytesIO()
        transparent = image.mode in ("RGBA", "LA") or "transparency" in image.info
        if transparent:
            image.convert("RGBA").save(output, format="PNG", optimize=True)
            content_type = "image/png"
        else:
            image.convert("RGB").save(output, format="JPEG", quality=82, optimize=True, progressive=True)
            content_type = "image/jpeg"
        return output.getvalue(), content_type


def event_image(request, filename, folder="events"):
    width = request.GET.get("width")
    if width is not None and width not in {str(value) for value in THUMBNAIL_WIDTHS}:
        return HttpResponseBadRequest("Unsupported image width.")
    # UUID upload names are immutable. Conditional requests avoid opening storage.
    etag = f'W/"{folder}-{filename}-{width or "original"}-v1"'
    response = get_conditional_response(request, etag=etag)
    if response is None:
        name = f"{folder}/{filename}"
        cached = caches["media"].get(f"{name}:{width}:v1") if width else None
        if cached is not None:
            data, content_type = cached
            response = HttpResponse(data, content_type=content_type)
        else:
            try:
                photo = default_storage.open(name, "rb")
            except FileNotFoundError:
                raise Http404
            if width:
                try:
                    with photo:
                        data, content_type = thumbnail(photo, int(width))
                except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
                    raise Http404
                # 32 entries of at most 512 KB keeps this cache below roughly 16 MB.
                if len(data) <= 512_000:
                    caches["media"].set(f"{name}:{width}:v1", (data, content_type), 3600)
                response = HttpResponse(data, content_type=content_type)
            else:
                response = FileResponse(photo, content_type="image/png" if filename.endswith(".png") else "image/jpeg")
    response["ETag"] = etag
    response["Cache-Control"] = "public, max-age=31536000, immutable"
    response["Cross-Origin-Resource-Policy"] = "cross-origin"
    response["X-Content-Type-Options"] = "nosniff"
    return response
