"""Build the free Render testing service. Configure a dedicated test database."""
import os
import subprocess
import sys


def main():
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    subprocess.run([sys.executable, "manage.py", "collectstatic", "--noinput"], check=True)
    migration_env = os.environ.copy()
    if migration_env.get("MIGRATION_DATABASE_URL"):
        migration_env["DATABASE_URL"] = migration_env["MIGRATION_DATABASE_URL"]
    subprocess.run([sys.executable, "manage.py", "migrate", "--noinput"], check=True, env=migration_env)


if __name__ == "__main__":
    main()
