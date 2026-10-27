"""
CookMate Configuration Module
Handles environment variables and application configurations.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent

# Load .env file if it exists
dotenv_path = BASE_DIR / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path)

class Config:
    """Base application configuration class."""
    
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'cookmate-secret-key-2026-vickey-secure-hash')
    
    # MySQL Database Settings
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'cookmate_db')
    
    # File Uploads
    UPLOAD_FOLDER = os.path.join(str(BASE_DIR), 'static', 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    
    # AI Chef Configuration
    AI_PROVIDER = os.getenv('AI_PROVIDER', 'gemini')
    AI_API_KEY = os.getenv('AI_API_KEY', '')
    
    # Session Configuration
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 86400 * 7  # 7 days
