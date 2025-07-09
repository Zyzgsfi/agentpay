#!/bin/bash

echo "🚀 Starting AgentPay Demo"
echo "========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running the demo."
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors."
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""

# Function to start a service in the background
start_service() {
    local service_name=$1
    local service_file=$2
    local port=$3
    
    echo "🚀 Starting $service_name on port $port..."
    node $service_file > logs/${service_name}.log 2>&1 &
    local pid=$!
    echo $pid > logs/${service_name}.pid
    
    # Wait a moment for service to start
    sleep 2
    
    # Check if service is running
    if ps -p $pid > /dev/null; then
        echo "✅ $service_name started successfully (PID: $pid)"
    else
        echo "❌ Failed to start $service_name"
        return 1
    fi
}

# Function to stop all services
stop_services() {
    echo ""
    echo "🛑 Stopping all services..."
    
    if [ -d "logs" ]; then
        for pidfile in logs/*.pid; do
            if [ -f "$pidfile" ]; then
                pid=$(cat "$pidfile")
                if ps -p $pid > /dev/null; then
                    kill $pid
                    echo "🛑 Stopped service (PID: $pid)"
                fi
                rm "$pidfile"
            fi
        done
    fi
    
    echo "✅ All services stopped."
}

# Create logs directory
mkdir -p logs

# Trap to stop services on script exit
trap stop_services EXIT

# Start main payment server
echo "🏢 Starting Payment Server..."
npm run dev > logs/payment-server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > logs/payment-server.pid

# Wait for server to start
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Payment Server started successfully (PID: $SERVER_PID)"
else
    echo "❌ Failed to start Payment Server"
    exit 1
fi

# Start service agents
start_service "Data Processing Agent" "dist/examples/dataProcessingAgent.js" 3001
start_service "AI Service Agent" "dist/examples/aiServiceAgent.js" 3002

# Wait for all services to fully initialize
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service health..."

check_service() {
    local name=$1
    local url=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$response" = "200" ]; then
        echo "✅ $name: Healthy"
    else
        echo "❌ $name: Not responding (HTTP $response)"
    fi
}

check_service "Payment Server" "http://localhost:3000/health"
check_service "Data Processing Agent" "http://localhost:3001/health"
check_service "AI Service Agent" "http://localhost:3002/health"

echo ""
echo "🎯 Demo Environment Ready!"
echo "========================="
echo "Payment Server: http://localhost:3000"
echo "Data Processing Agent: http://localhost:3001"
echo "AI Service Agent: http://localhost:3002"
echo ""
echo "Available commands:"
echo "  1. Run client demo: node dist/examples/clientAgent.js"
echo "  2. Check service discovery: curl http://localhost:3001/services"
echo "  3. Test payment endpoint: curl http://localhost:3000/api/premium-data"
echo "  4. View logs: tail -f logs/payment-server.log"
echo ""
echo "Press Ctrl+C to stop all services and exit."
echo ""

# Keep the script running
while true; do
    sleep 10
    
    # Check if all services are still running
    if ! ps -p $SERVER_PID > /dev/null; then
        echo "❌ Payment Server died. Restarting..."
        npm run dev > logs/payment-server.log 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > logs/payment-server.pid
    fi
    
    # Check other services
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ] && [ "$pidfile" != "logs/payment-server.pid" ]; then
            pid=$(cat "$pidfile")
            if ! ps -p $pid > /dev/null; then
                service_name=$(basename "$pidfile" .pid)
                echo "❌ $service_name died. Check logs for details."
            fi
        fi
    done
done