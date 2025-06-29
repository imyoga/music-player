# Timer API Backend

A Node.js/Express timer API with real-time updates via Server-Sent Events (SSE), built following industry best practices.

## 🏗️ Architecture

This backend follows a clean, modular architecture with proper separation of concerns:

```
Backend/
├── config/
│   └── config.js          # Centralized configuration
├── controllers/
│   └── timerController.js # Request/response handling
├── middleware/
│   ├── errorHandler.js    # Global error handling
│   └── logger.js          # Request logging
├── routes/
│   ├── index.js           # Main route aggregator
│   └── timerRoutes.js     # Timer-specific routes
├── services/
│   └── timerService.js    # Business logic & state management
├── public/                # Static frontend files
└── server.js              # Application entry point
```

## 🎯 Key Features

- **Modular Architecture**: Clean separation of routes, controllers, services, and middleware
- **Real-time Updates**: Server-Sent Events (SSE) for live timer synchronization
- **Persistent State**: Timer state survives server restarts
- **High Precision**: 1-second accuracy for smooth music synchronization
- **Error Handling**: Centralized error handling with consistent API responses
- **Logging**: Request/response logging with performance metrics
- **Graceful Shutdown**: Proper cleanup on server termination
- **Health Checks**: Built-in health monitoring endpoints

## 📡 API Endpoints

### Timer Operations
- `POST /api/start` - Start a new timer
- `POST /api/stop` - Stop the current timer
- `POST /api/pause` - Pause the timer
- `POST /api/continue` - Resume a paused timer
- `POST /api/set-elapsed` - Adjust timer by setting elapsed time
- `GET /api/status` - Get current timer status
- `GET /api/stream` - Real-time timer updates (SSE)

### System
- `GET /api/health` - Health check endpoint
- `GET /test` - Simple test endpoint

## 🏛️ Architecture Principles

### 1. Separation of Concerns
- **Routes**: Handle HTTP routing and parameter extraction
- **Controllers**: Manage request/response cycle and validation
- **Services**: Contain business logic and data management
- **Middleware**: Handle cross-cutting concerns (logging, errors)

### 2. Configuration Management
- Centralized configuration in `config/config.js`
- Environment-based settings support
- Easy to modify without code changes

### 3. Error Handling
- Global error handling middleware
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging

### 4. Service Layer Pattern
- Business logic isolated in services
- Singleton pattern for timer state management
- Testable and reusable components

## 🔧 Configuration

Key configuration options in `config/config.js`:

```javascript
{
  server: {
    port: 45001,
    host: 'localhost'
  },
  timer: {
    precision: 1000,        // 1 second intervals
    precisionTenths: 10,    // Internal precision (tenths)
    stateFile: 'timer.json' // Persistence file
  }
}
```

## 🚀 Running the Server

```bash
# Development
npm run dev
# or
yarn dev

# Production
npm start
# or
yarn start
```

## 📊 Logging

The server includes comprehensive logging:
- Request/response logging with timing
- Error logging with stack traces
- Server startup/shutdown events
- SSE connection management

## 🛡️ Error Handling

Robust error handling includes:
- Global error middleware
- Graceful shutdown handling
- Uncaught exception handling
- Promise rejection handling
- Port conflict detection

## 🔄 State Management

Timer state is managed through:
- In-memory state for performance
- File-based persistence for reliability
- Automatic state restoration on restart
- Real-time synchronization via SSE

## 📈 Performance Considerations

- Singleton service instances
- Efficient SSE client management
- Minimal memory footprint
- Optimized timer precision
- Connection cleanup on disconnect

## 🧪 Best Practices Implemented

1. **MVC Pattern**: Clear separation of Model, View, and Controller logic
2. **Middleware Pipeline**: Proper order of middleware execution
3. **Error First**: Comprehensive error handling throughout
4. **Configuration Driven**: External configuration management
5. **Graceful Shutdown**: Proper resource cleanup
6. **Logging**: Comprehensive request/response logging
7. **Security**: CORS configuration and input validation
8. **Performance**: Efficient resource management

This refactored architecture provides a solid foundation for scalability, maintainability, and testability while following Node.js/Express best practices. 