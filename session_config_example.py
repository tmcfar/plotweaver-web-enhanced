"""
Add this to your app.py to enable session management
"""

from flask import Flask, g, session
from flask_cors import CORS
from flask_session import Session
import redis
import os

def create_app(config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Basic configuration
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    app.config["SESSION_TYPE"] = "filesystem"  # Use filesystem for development
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_FILE_DIR"] = "/tmp/flask_session"
    
    # For production, use Redis:
    # app.config["SESSION_TYPE"] = "redis"
    # app.config["SESSION_REDIS"] = redis.StrictRedis(host='localhost', port=6379, db=0)
    
    # Initialize Flask-Session
    Session(app)
    
    # Enable CORS
    CORS(app, 
         resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:3001"]}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # ... rest of your app configuration ...
    
    @app.before_request
    def before_request():
        """Set up request context"""
        # Make project_manager available in g
        g.project_manager = app.extensions.get('project_manager')
        
        # Load active project if in session
        if 'active_project_id' in session:
            g.active_project_id = session['active_project_id']
            
    return app
