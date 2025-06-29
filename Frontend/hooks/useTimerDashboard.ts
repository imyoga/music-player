import { useState, useRef, useEffect } from 'react'
import { API_CONFIG, getApiUrl } from '@/lib/config'
import type { TimerState } from '@/types/music-player'

export const useTimerDashboard = (accessCode: string | null) => {
	const [timerState, setTimerState] = useState<TimerState>({
		id: null,
		duration: 0,
		remainingTime: 0,
		durationSeconds: 0,
		remainingSeconds: 0,
		isRunning: false,
		isPaused: false,
		timestamp: 0,
		precision: 0.1,
	})

	const [isConnected, setIsConnected] = useState(false)
	const [syncedTimerState, setSyncedTimerState] = useState<TimerState>(timerState)

	const eventSourceRef = useRef<EventSource | null>(null)
	const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

	// Local synchronization helper functions
	const startLocalSync = (serverData: TimerState) => {
		stopLocalSync() // Clear any existing sync

		if (!serverData.targetEndTime || !serverData.serverTime) return

		syncIntervalRef.current = setInterval(() => {
			const now = Date.now()
			const calculatedRemainingMs = Math.max(0, serverData.targetEndTime! - now)
			const calculatedRemainingTenths = Math.round(calculatedRemainingMs / 100) // Convert to tenths of seconds

			if (calculatedRemainingTenths <= 0) {
				// Timer finished locally
				setSyncedTimerState(prev => ({
					...prev,
					remainingTime: 0,
					remainingSeconds: 0,
					isRunning: false,
					isPaused: false,
				}))
				stopLocalSync()
			} else {
				// Update with locally calculated time
				setSyncedTimerState(prev => ({
					...serverData,
					remainingTime: calculatedRemainingTenths,
					remainingSeconds: calculatedRemainingTenths / 10,
				}))
			}
		}, 100) // Update every 100ms for smooth display
	}

	const stopLocalSync = () => {
		if (syncIntervalRef.current) {
			clearInterval(syncIntervalRef.current)
			syncIntervalRef.current = null
		}
	}

	// Connect to SSE stream for real-time updates
	useEffect(() => {
		// Only connect if we have an access code
		if (!accessCode) {
			setIsConnected(false)
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
				eventSourceRef.current = null
			}
			stopLocalSync()
			return
		}

		const connectToStream = () => {
			try {
				const streamUrl = getApiUrl(API_CONFIG.ENDPOINTS.TIMER.STREAM) + `?accessCode=${accessCode}`


				// Clear any existing connection first
				if (eventSourceRef.current) {

					eventSourceRef.current.close()
					eventSourceRef.current = null
				}

				const eventSource = new EventSource(streamUrl)
				eventSourceRef.current = eventSource

				eventSource.onopen = () => {
					setIsConnected(true)

				}

				eventSource.onmessage = event => {
					try {
						const data = JSON.parse(event.data)

						setTimerState(data)

						// Start local synchronization if we have targetEndTime
						if (data.targetEndTime && data.isRunning && !data.isPaused) {
							startLocalSync(data)
						} else {
							stopLocalSync()
							setSyncedTimerState(data)
						}
					} catch (error) {
						console.error('❌ Timer Dashboard: Failed to parse timer data:', error)
					}
				}

				eventSource.onerror = error => {
					console.error('❌ Timer Dashboard: SSE connection error:', error)
					console.error('❌ EventSource readyState:', eventSource.readyState)
					console.error('❌ Stream URL was:', streamUrl)
					setIsConnected(false)

					// Attempt to reconnect after 3 seconds
					setTimeout(() => {
						if (eventSourceRef.current?.readyState === EventSource.CLOSED) {

							connectToStream()
						}
					}, 3000)
				}
			} catch (error) {
				console.error('❌ Timer Dashboard: Failed to connect to stream:', error)
				setIsConnected(false)

				// Retry connection after 3 seconds
				setTimeout(() => {

					connectToStream()
				}, 3000)
			}
		}

		connectToStream()

		return () => {

			if (eventSourceRef.current) {
				eventSourceRef.current.close()
			}
			stopLocalSync()
		}
	}, [accessCode]) // Re-connect when access code changes

	return {
		timerState,
		syncedTimerState,
		isConnected,
	}
} 