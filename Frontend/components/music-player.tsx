'use client'

import type React from 'react'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
	Play,
	Pause,
	SkipBack,
	SkipForward,
	Volume2,
	Music,
	Upload,
	Square,
} from 'lucide-react'

interface Track {
	file: File
	url: string
	name: string
	duration: number
}

export default function MusicPlayer() {
	const [tracks, setTracks] = useState<Track[]>([])
	const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [volume, setVolume] = useState([1.0])
	const [isLoading, setIsLoading] = useState(false)

	const audioRef = useRef<HTMLAudioElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const currentTrack = tracks[currentTrackIndex]

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
			if (currentTrackIndex < tracks.length - 1) {
				playNext()
			} else {
				setIsPlaying(false)
				setCurrentTime(0)
				audio.currentTime = 0
			}
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
	}, [currentTrackIndex, tracks.length])

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

	const playTrack = async () => {
		const audio = audioRef.current
		if (!audio || !currentTrack || isLoading) return

		try {
			await audio.play()
			setIsPlaying(true)
		} catch (error) {
			console.error('Error playing audio:', error)
			setIsPlaying(false)
		}
	}

	const pauseTrack = () => {
		const audio = audioRef.current
		if (!audio) return

		audio.pause()
		setIsPlaying(false)
	}

	const stopTrack = () => {
		const audio = audioRef.current
		if (!audio) return

		audio.pause()
		audio.currentTime = 0
		setCurrentTime(0)
		setIsPlaying(false)
	}

	const playPrevious = () => {
		if (currentTrackIndex > 0) {
			setIsPlaying(false)
			setCurrentTrackIndex((prev) => prev - 1)
		}
	}

	const playNext = () => {
		if (currentTrackIndex < tracks.length - 1) {
			setIsPlaying(false)
			setCurrentTrackIndex((prev) => prev + 1)
		}
	}

	const handleSeek = (value: number[]) => {
		const audio = audioRef.current
		if (!audio || !duration) return

		const newTime = value[0]
		audio.currentTime = newTime
		setCurrentTime(newTime)
	}

	const handleVolumeChange = (value: number[]) => {
		setVolume(value)
	}

	const selectTrack = (index: number) => {
		if (index === currentTrackIndex) {
			// If clicking the same track, just play/pause
			if (isPlaying) {
				pauseTrack()
			} else {
				playTrack()
			}
		} else {
			// If clicking a different track, switch to it
			setIsPlaying(false)
			setCurrentTrackIndex(index)
		}
	}

	const formatTime = (time: number) => {
		if (isNaN(time)) return '0:00'
		const minutes = Math.floor(time / 60)
		const seconds = Math.floor(time % 60)
		return `${minutes}:${seconds.toString().padStart(2, '0')}`
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4'>
			<div className='max-w-md mx-auto space-y-6'>
				{/* Header */}
				<div className='text-center text-white'>
					<Music className='w-12 h-12 mx-auto mb-2' />
					<h1 className='text-2xl font-bold'>Music Player</h1>
					<p className='text-purple-200'>
						Select and play your favorite tracks
					</p>
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
							Select Music Files
						</Button>
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

							{/* Progress Bar */}
							<div className='space-y-2'>
								<Slider
									value={[currentTime]}
									max={duration || 100}
									step={0.1}
									onValueChange={handleSeek}
									className='w-full'
									disabled={!duration || isLoading}
								/>
								<div className='flex justify-between text-sm text-purple-200'>
									<span>{formatTime(currentTime)}</span>
									<span>{formatTime(duration)}</span>
								</div>
							</div>

							{/* Controls */}
							<div className='flex items-center justify-center space-x-3 mt-6'>
								<Button
									variant='ghost'
									size='icon'
									onClick={playPrevious}
									disabled={currentTrackIndex === 0}
									className='text-white hover:bg-white/20'
								>
									<SkipBack className='w-5 h-5' />
								</Button>

								<Button
									size='icon'
									onClick={playTrack}
									disabled={isPlaying || isLoading}
									className='w-12 h-12 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
								>
									<Play className='w-5 h-5 ml-0.5' />
								</Button>

								<Button
									size='icon'
									onClick={pauseTrack}
									disabled={!isPlaying || isLoading}
									className='w-12 h-12 bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
								>
									<Pause className='w-5 h-5' />
								</Button>

								<Button
									size='icon'
									onClick={stopTrack}
									disabled={(!isPlaying && currentTime === 0) || isLoading}
									className='w-12 h-12 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
								>
									<Square className='w-5 h-5' />
								</Button>

								<Button
									variant='ghost'
									size='icon'
									onClick={playNext}
									disabled={currentTrackIndex === tracks.length - 1}
									className='text-white hover:bg-white/20'
								>
									<SkipForward className='w-5 h-5' />
								</Button>
							</div>

							{/* Volume Control */}
							<div className='flex items-center space-x-3 mt-6'>
								<Volume2 className='w-5 h-5 text-white' />
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
						</CardContent>
					</Card>
				)}

				{/* Playlist */}
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
												{index === currentTrackIndex && isPlaying ? (
													<Pause className='w-4 h-4 text-white' />
												) : (
													<Play className='w-4 h-4 text-white ml-0.5' />
												)}
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

				{/* Hidden Audio Element */}
				<audio ref={audioRef} preload='metadata' />
			</div>
		</div>
	)
}
