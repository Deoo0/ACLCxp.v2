# Event photos

In the event editor, select a JPG or PNG (up to 5 MB) for the background or poster.
The original is selected immediately. Optionally choose **Crop to 16:9**, adjust
zoom and position, and choose **Apply crop** before saving the event. **Use original**
restores the selected file. Existing photos remain unchanged unless replaced or removed.

Images are validated with Pillow and stored under `MEDIA_ROOT/events` with generated
filenames. Existing URL-based photos remain readable; new URL input is rejected.
The application serves these photos at `/media/events/<filename>`.

Production uses `apps.core.storage.DatabaseMediaStorage`: new event artwork and house
logos are stored in the shared application database, so all server instances and
accounts read the same bytes and uploads survive redeployment. Include the
`core_uploadedimage` table in database backups and monitor database size (each
upload may be up to 5 MB). Development continues to use local files.

Deploy the backend and frontend together. The API returns `/media/...` paths for
uploaded images; the frontend resolves them against `VITE_API_URL`, avoiding both
frontend-host 404s and HTTP image URLs inferred from an HTTPS reverse proxy.
External legacy image URLs are retained unchanged.

Before restarting/replacing a server that still has existing uploaded files:

```sh
python manage.py migrate
python manage.py preserve_uploads
```

Run `preserve_uploads` on the existing runtime with its original `MEDIA_ROOT`.
It copies referenced event/house files into the database without deleting the
originals and can be rerun safely. Local files remain readable as a fallback.
Files already lost from an ephemeral disk must be restored from a backup or
uploaded again; a database filename alone cannot recover their contents.
