// API Configuration
export const API_CONFIG = {
	// Backend API base URL - empty since we're using Next.js proxy for development
	BASE_URL: '',

	// API endpoints - clean without any prefixes
	ENDPOINTS: {
		TIMER: {
			START: '/api/start',
			STOP: '/api/stop',
			PAUSE: '/api/pause',
			CONTINUE: '/api/continue',
			SET_ELAPSED: '/api/set-elapsed',
			STATUS: '/api/status',
			STREAM: '/api/stream',
			ACTIVE: '/api/active'
		}
	}
}

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
	return `${API_CONFIG.BASE_URL}${endpoint}`
} 