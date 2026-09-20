# Event photos

In the event editor, select a JPG or PNG (up to 5 MB) for the background or poster.
The original is selected immediately. Optionally choose **Crop to 16:9**, adjust
zoom and position, and choose **Apply crop** before saving the event. **Use original**
restores the selected file. Existing photos remain unchanged unless replaced or removed.

Images are validated with Pillow and stored under `MEDIA_ROOT/events` with generated
filenames. Existing URL-based photos remain readable; new URL input is rejected.
The application serves these photos at `/media/events/<filename>`.

For production, set `MEDIA_ROOT` to a persistent writable disk shared by all backend
instances and include it in backups. Ephemeral hosting disks lose uploads on redeploy.
The default for local development is `backend/media` (excluded from Git).
Run `python manage.py migrate` when deploying this change.
