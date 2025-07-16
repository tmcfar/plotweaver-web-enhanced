#!/bin/bash
# PlotWeaver Full Stack Startup Script

echo "Starting PlotWeaver services..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use. Please stop the service using it."
        return 1
    fi
    return 0
}

# Check all required ports
echo "Checking ports..."
check_port 5000 || exit 1
check_port 8000 || exit 1
check_port 3000 || exit 1

# Start Flask backend
echo "Starting Flask backend on port 5000..."
cd /home/tmcfar/dev/pw2
source venv/bin/activate
python -m plotweaver.ui.app &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Start BFF
echo "Starting BFF on port 8000..."
cd /home/tmcfar/dev/pw-web/bff
python -m uvicorn server.main:app --reload --port 8000 &
BFF_PID=$!
echo "BFF PID: $BFF_PID"

# Wait for BFF to start
sleep 5

# Test connections
echo "Testing connections..."
cd /home/tmcfar/dev/pw-web
python test_connection.py

# Start frontend
echo "Starting frontend on port 3000..."
cd /home/tmcfar/dev/pw-web/frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "All services started!"
echo "Backend: http://localhost:5000"
echo "BFF: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "To stop all services, run:"
echo "kill $BACKEND_PID $BFF_PID $FRONTEND_PID"
echo ""
echo "Or press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $BFF_PID $FRONTEND_PID; exit" INT
wait
