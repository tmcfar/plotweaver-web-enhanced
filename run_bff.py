#!/usr/bin/env python
"""Runner script for the BFF server."""

import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the server
from bff.server.main import app
import uvicorn

if __name__ == "__main__":
    print("Starting PlotWeaver BFF server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
