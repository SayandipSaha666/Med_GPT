from pathlib import Path

from dotenv import load_dotenv

def load_environment() -> None:
    """Load only this service's environment file, regardless of process cwd."""
    env_file = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_file, override=False)
