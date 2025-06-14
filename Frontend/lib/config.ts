// API Configuration
export const API_CONFIG = {
	// Backend API base URL - hardcoded for local development
	BASE_URL: 'http://localhost:45001',

	// API endpoints
	ENDPOINTS: {
		TIMER: {
			START: '/api/timer/start',
			STOP: '/api/timer/stop',
			PAUSE: '/api/timer/pause',
			CONTINUE: '/api/timer/continue',
			SET_ELAPSED: '/api/timer/set-elapsed',
			STATUS: '/api/timer/status',
			STREAM: '/api/timer/stream'
		}
	}
}

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
	return `${API_CONFIG.BASE_URL}${endpoint}`
} 