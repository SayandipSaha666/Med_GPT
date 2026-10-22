from pathlib import Path

from dotenv import load_dotenv

def load_environment() -> None:
    env_file = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_file, override=False)
