'use client'

import type React from 'react'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, Music, Upload, Radio, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Track {
	file: File
	url: string
	name: string
	duration: number
}

interface TimerState {
	id: string | null
	duration: number // in tenths of seconds
	remainingTime: number // in tenths of seconds
	durationSeconds: number // for display
	remainingSeconds: number // for display
	isRunning: boolean
	isPaused: boolean
	timestamp: number
	precision: number // 0.1 for tenth of second precision
}

export default function MusicPlayer() {
	const [tracks, setTracks] = useState<Track[]>([])
	const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [volume, setVolume] = useState([1.0])
	const [isLoading, setIsLoading] = useState(false)

	// Timer synchronization state
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
	const [lastSyncTime, setLastSyncTime] = useState(0)

	const audioRef = useRef<HTMLAudioElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const eventSourceRef = useRef<EventSource | null>(null)
	const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const currentTrack = tracks[currentTrackIndex]
	const API_BASE = 'http://localhost:3001'

	// Connect to timer SSE stream for synchronization
	useEffect(() => {
		const connectToTimerStream = () => {
			try {
				const eventSource = new EventSource(`${API_BASE}/api/timer/stream`)
				eventSourceRef.current = eventSource

				eventSource.onopen = () => {
					setIsConnected(true)
					console.log('Connected to timer stream for music sync')
				}

				eventSource.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data)
						setTimerState(data)
						setLastSyncTime(Date.now())
					} catch (error) {
						console.error('Failed to parse timer data:', error)
					}
				}

				eventSource.onerror = (error) => {
					console.error('Timer SSE connection error:', error)
					setIsConnected(false)

					// Reconnect after 3 seconds
					setTimeout(() => {
						if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
							connectToTimerStream()
						}
					}, 3000)
				}
			} catch (error) {
				console.error('Failed to connect to timer stream:', error)
				setIsConnected(false)
			}
		}

		connectToTimerStream()

		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
			}
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current)
			}
		}
	}, [])

	// Sync audio playback with timer state
	useEffect(() => {
		const audio = audioRef.current
		if (!audio || !currentTrack || !isConnected) return

		const elapsedTime = (timerState.duration - timerState.remainingTime) / 10 // Convert to seconds

		// Handle timer state changes
		if (timerState.isRunning && !timerState.isPaused) {
			// Timer is running - play audio and sync position
			if (!isPlaying) {
				setIsPlaying(true)
				audio.play().catch(console.error)
			}

			// Sync audio position with timer elapsed time
			const timeDiff = Math.abs(audio.currentTime - elapsedTime)
			if (timeDiff > 0.5) {
				// Only sync if difference is significant (0.5s)
				audio.currentTime = Math.min(elapsedTime, audio.duration || 0)
				console.log(`Syncing audio to timer: ${elapsedTime.toFixed(1)}s`)
			}
		} else if (timerState.isPaused) {
			// Timer is paused - pause audio
			if (isPlaying) {
				setIsPlaying(false)
				audio.pause()
			}
		} else {
			// Timer is stopped - stop audio and reset
			if (isPlaying) {
				setIsPlaying(false)
				audio.pause()
				audio.currentTime = 0
				setCurrentTime(0)
			}
		}
	}, [timerState, currentTrack, isConnected])

	// Initialize audio element and event listeners
	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		const handleTimeUpdate = () => {
			setCurrentTime(audio.currentTime)
		}

		const handleLoadedMetadata = () => {
			setDuration(audio.duration)
			setIsLoading(false)
		}

		const handleCanPlay = () => {
			setIsLoading(false)
		}

		const handleLoadStart = () => {
			setIsLoading(true)
		}

		const handleEnded = () => {
			// In radio mode, don't auto-advance tracks
			// Let the timer control playback
			setIsPlaying(false)
			setCurrentTime(0)
			audio.currentTime = 0
		}

		const handleError = () => {
			setIsLoading(false)
			setIsPlaying(false)
			console.error('Audio loading error')
		}

		audio.addEventListener('timeupdate', handleTimeUpdate)
		audio.addEventListener('loadedmetadata', handleLoadedMetadata)
		audio.addEventListener('canplay', handleCanPlay)
		audio.addEventListener('loadstart', handleLoadStart)
		audio.addEventListener('ended', handleEnded)
		audio.addEventListener('error', handleError)

		return () => {
			audio.removeEventListener('timeupdate', handleTimeUpdate)
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
			audio.removeEventListener('canplay', handleCanPlay)
			audio.removeEventListener('loadstart', handleLoadStart)
			audio.removeEventListener('ended', handleEnded)
			audio.removeEventListener('error', handleError)
		}
	}, [currentTrackIndex])

	// Load new track when currentTrackIndex changes
	useEffect(() => {
		const audio = audioRef.current
		if (!audio || !currentTrack) return

		setIsLoading(true)
		setCurrentTime(0)
		setDuration(0)

		audio.src = currentTrack.url
		audio.volume = volume[0]
		audio.load()
	}, [currentTrack])

	// Update volume when volume state changes
	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		audio.volume = volume[0]
	}, [volume])

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (!files || files.length === 0) return

		const file = files[0]
		if (file.type.startsWith('audio/')) {
			const url = URL.createObjectURL(file)
			const newTrack = {
				file,
				url,
				name: file.name.replace(/\.[^/.]+$/, ''),
				duration: 0,
			}
			setTracks([newTrack])
			setCurrentTrackIndex(0)
			setIsPlaying(false)
			setCurrentTime(0)
		}
	}

	const selectTrack = (index: number) => {
		if (index !== currentTrackIndex) {
			setCurrentTrackIndex(index)
			// Reset playback state when changing tracks
			setIsPlaying(false)
			setCurrentTime(0)
		}
	}

	const handleVolumeChange = (value: number[]) => {
		setVolume(value)
	}

	const formatTime = (time: number) => {
		if (isNaN(time)) return '0:00'
		const minutes = Math.floor(time / 60)
		const seconds = Math.floor(time % 60)
		return `${minutes}:${seconds.toString().padStart(2, '0')}`
	}

	const getTimerElapsedTime = () => {
		return (timerState.duration - timerState.remainingTime) / 10
	}

	const getConnectionStatus = () => {
		return isConnected ? (
			<Badge variant='default' className='bg-green-500'>
				<Wifi className='w-3 h-3 mr-1' />
				Connected
			</Badge>
		) : (
			<Badge variant='destructive'>
				<WifiOff className='w-3 h-3 mr-1' />
				Disconnected
			</Badge>
		)
	}

	const getPlaybackStatus = () => {
		if (!timerState.id) {
			return <Badge variant='outline'>Waiting for Timer</Badge>
		} else if (timerState.isRunning) {
			return (
				<Badge variant='default' className='bg-green-500'>
					<Play className='w-3 h-3 mr-1' />
					Playing
				</Badge>
			)
		} else if (timerState.isPaused) {
			return (
				<Badge variant='secondary'>
					<Pause className='w-3 h-3 mr-1' />
					Paused
				</Badge>
			)
		} else {
			return <Badge variant='outline'>Stopped</Badge>
		}
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4'>
			<div className='max-w-md mx-auto space-y-6'>
				{/* Header */}
				<div className='text-center text-white'>
					<Radio className='w-12 h-12 mx-auto mb-2' />
					<h1 className='text-2xl font-bold'>Synchronized Radio Player</h1>
					<p className='text-purple-200'>Synced with server timer</p>
					<div className='flex justify-center gap-2 mt-2'>
						{getConnectionStatus()}
						{getPlaybackStatus()}
					</div>
				</div>

				{/* File Upload */}
				<Card className='bg-white/10 backdrop-blur border-white/20'>
					<CardContent className='p-6'>
						<input
							ref={fileInputRef}
							type='file'
							accept='audio/*'
							onChange={handleFileSelect}
							className='hidden'
						/>
						<Button
							onClick={() => fileInputRef.current?.click()}
							className='w-full bg-purple-600 hover:bg-purple-700 text-white'
							size='lg'
						>
							<Upload className='w-5 h-5 mr-2' />
							Select Music File
						</Button>
						<p className='text-xs text-purple-200 mt-2 text-center'>
							Playback is controlled by the server timer
						</p>
					</CardContent>
				</Card>

				{/* Current Track Display */}
				{currentTrack && (
					<Card className='bg-white/10 backdrop-blur border-white/20'>
						<CardContent className='p-6 text-center'>
							<div className='w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center'>
								<Music className='w-10 h-10 text-white' />
							</div>
							<h2 className='text-xl font-semibold text-white mb-2 truncate'>
								{currentTrack.name}
							</h2>

							{isLoading && (
								<p className='text-purple-200 text-sm mb-4'>Loading...</p>
							)}

							{/* Progress Bar - Shows current playback position */}
							<div className='space-y-2'>
								<Slider
									value={[currentTime]}
									max={duration || 100}
									step={0.1}
									className='w-full pointer-events-none opacity-75'
									disabled={true}
								/>
								<div className='flex justify-between text-sm text-purple-200'>
									<span>{formatTime(currentTime)}</span>
									<span>{formatTime(duration)}</span>
								</div>
							</div>

							{/* Timer Sync Info */}
							<div className='mt-4 p-3 bg-white/5 rounded-lg'>
								<div className='text-sm text-purple-200 space-y-1'>
									<div className='flex justify-between'>
										<span>Timer Elapsed:</span>
										<span className='font-mono'>
											{formatTime(getTimerElapsedTime())}
										</span>
									</div>
									<div className='flex justify-between'>
										<span>Audio Position:</span>
										<span className='font-mono'>{formatTime(currentTime)}</span>
									</div>
									<div className='flex justify-between'>
										<span>Sync Status:</span>
										<span
											className={`font-mono ${
												Math.abs(currentTime - getTimerElapsedTime()) < 1
													? 'text-green-300'
													: 'text-yellow-300'
											}`}
										>
											{Math.abs(currentTime - getTimerElapsedTime()) < 1
												? 'In Sync'
												: 'Syncing...'}
										</span>
									</div>
								</div>
							</div>

							{/* Volume Control - Only user control available */}
							<div className='flex items-center space-x-3 mt-6'>
								<Music className='w-5 h-5 text-white' />
								<Slider
									value={volume}
									max={1}
									step={0.1}
									onValueChange={handleVolumeChange}
									className='flex-1'
								/>
								<span className='text-white text-sm w-10'>
									{Math.round(volume[0] * 100)}%
								</span>
							</div>

							<p className='text-xs text-purple-300 mt-3'>
								🎵 Playback controlled by server timer • Volume adjustable
							</p>
						</CardContent>
					</Card>
				)}

				{/* Track Selection */}
				{tracks.length > 0 && (
					<Card className='bg-white/10 backdrop-blur border-white/20'>
						<CardContent className='p-6'>
							<h3 className='text-lg font-semibold text-white mb-4'>
								Current Track
							</h3>
							<div className='space-y-2'>
								{tracks.map((track, index) => (
									<div
										key={index}
										onClick={() => selectTrack(index)}
										className={`p-3 rounded-lg cursor-pointer transition-colors ${
											index === currentTrackIndex
												? 'bg-purple-600/50 text-white'
												: 'bg-white/5 text-purple-100 hover:bg-white/10'
										}`}
									>
										<div className='flex items-center space-x-3'>
											<div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0'>
												<Radio className='w-4 h-4 text-white' />
											</div>
											<span className='truncate flex-1'>{track.name}</span>
											{index === currentTrackIndex && isPlaying && (
												<div className='flex space-x-1'>
													<div className='w-1 h-4 bg-white rounded animate-pulse'></div>
													<div className='w-1 h-4 bg-white rounded animate-pulse delay-75'></div>
													<div className='w-1 h-4 bg-white rounded animate-pulse delay-150'></div>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Timer Status Display */}
				<Card className='bg-white/10 backdrop-blur border-white/20'>
					<CardContent className='p-4'>
						<h3 className='text-sm font-semibold text-white mb-3'>
							Server Timer Status
						</h3>
						<div className='grid grid-cols-2 gap-3 text-xs text-purple-200'>
							<div>
								<span className='font-medium'>Timer ID:</span>
								<div className='font-mono'>{timerState.id || 'None'}</div>
							</div>
							<div>
								<span className='font-medium'>State:</span>
								<div>
									{timerState.isRunning
										? 'Running'
										: timerState.isPaused
										? 'Paused'
										: 'Stopped'}
								</div>
							</div>
							<div>
								<span className='font-medium'>Elapsed:</span>
								<div className='font-mono'>
									{formatTime(getTimerElapsedTime())}
								</div>
							</div>
							<div>
								<span className='font-medium'>Remaining:</span>
								<div className='font-mono'>
									{formatTime(timerState.remainingTime / 10)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Hidden Audio Element */}
				<audio ref={audioRef} preload='metadata' />
			</div>
		</div>
	)
}
