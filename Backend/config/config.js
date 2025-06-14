module.exports = {
  server: {
    port: process.env.PORT || 45001,
    host: process.env.HOST || 'localhost',
  },
  timer: {
    precision: 1000, // 1 second precision in milliseconds
    precisionTenths: 10, // 10 tenths per second
    stateFile: 'timer.json',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  paths: {
    public: 'public',
    frontend: {
      index: 'index.html',
    },
  },
}; 