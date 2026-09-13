import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  signal,
  computed,
} from '@angular/core';
import { CommonModule,Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface VideoSource {
  label: string;
  src: string;
}

interface Movie {
  id: string;
  title: string;
  qualities: VideoSource[];
}

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.css'],
})
export class WatchComponent implements OnInit {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('playerWrapper') wrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChild('progressTrack') progressTrackRef!: ElementRef<HTMLDivElement>;

  // Demo catalog. Point every quality at your single file until 480p/720p/1080p encodes exist.
  movies: Movie[] = [
    {
      id: 'bahubali1',
      title: 'Bahubali-The Beginning',
      qualities: [
        { label: '1080p', src: 'assets/movies/Bahubali1/bahubali1.mp4' },
        { label: '720p', src: 'assets/movies/Bahubali1/bahubali1.mp4' },
        { label: '480p', src: 'assets/movies/Bahubali1/bahubali1.mp4' },
      ], 
    },
    {
      id: 'wildlife',
      title: 'Wildlife 4K',
      qualities: [
        { label: '4K', src: 'assets/movies/wildlife.mp4' },
        { label: '720p', src: 'assets/movies/wildlife/wildlife-720p.mp4' },
        { label: '480p', src: 'assets/movies/wildlife/wildlife-480p.mp4' },
      ], 
    },
    {
      id: 'barsat',
      title: 'Barsaat',
      qualities: [
        { label: '1080p', src: 'assets/movies/barsat.mp4' },
        { label: '720p', src: 'assets/movies/barsat/barsat-720p.mp4' },
        { label: '480p', src: 'assets/movies/barsat/barsat-480p.mp4' },
      ], 
    },
    {
      id: 'tujhko',
      title: 'Tujhko',
      qualities: [
        { label: '1080p', src: 'assets/movies/tujhko.mp4' },
        { label: '720p', src: 'assets/movies/tujhko/tujhko-720p.mp4' },
        { label: '480p', src: 'assets/movies/tujhko/tujhko-480p.mp4' },
      ],
    },
  ];

  currentIndex = signal(0);
  currentMovie = computed(() => this.movies[this.currentIndex()]);

  selectedQuality = signal('1080p');
  isPlaying = signal(false);
  isLoading = signal(true);
  currentTime = signal(0);
  duration = signal(0);
  bufferedEnd = signal(0);
  volume = signal(1);
  isMuted = signal(false);
  playbackRate = signal(1);
  isFullscreen = signal(false);
  showControls = signal(true);
  showQualityMenu = signal(false);
  showSpeedMenu = signal(false);


  speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  private hideControlsTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingResume: { time: number; wasPlaying: boolean } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const index = this.movies.findIndex((m) => m.id === params.get('id'));
      this.currentIndex.set(index >= 0 ? index : 0);
      this.isLoading.set(true);
    });
  }

  get activeSrc(): string {
    const movie = this.currentMovie();
    return (
      movie.qualities.find((q) => q.label === this.selectedQuality())?.src ??
      movie.qualities[0].src
    );
  }

  // --- Playback ---
  togglePlay(): void {
    const video = this.videoRef.nativeElement;
    video.paused ? video.play() : video.pause();
  }

  onLoadedMetadata(): void {
    const video = this.videoRef.nativeElement;
    this.duration.set(video.duration);
    this.isLoading.set(false);
    if (this.pendingResume) {
      video.currentTime = this.pendingResume.time;
      if (this.pendingResume.wasPlaying) video.play();
      this.pendingResume = null;
    }
  }

  onTimeUpdate(): void {
    this.currentTime.set(this.videoRef.nativeElement.currentTime);
  }

  onProgress(): void {
    const video = this.videoRef.nativeElement;
    if (video.buffered.length) {
      this.bufferedEnd.set(video.buffered.end(video.buffered.length - 1));
    }
  }

  onEnded(): void {
    this.goNext();
  }

  // --- Seeking ---
  seekTo(event: MouseEvent): void {
    const rect = this.progressTrackRef.nativeElement.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1,
    );
    this.videoRef.nativeElement.currentTime = ratio * this.duration();
  }

  seekBy(seconds: number): void {
    const video = this.videoRef.nativeElement;
    video.currentTime = Math.min(
      Math.max(video.currentTime + seconds, 0),
      this.duration(),
    );
  }

  get progressPercent(): number {
    return this.duration() ? (this.currentTime() / this.duration()) * 100 : 0;
  }

  get bufferedPercent(): number {
    return this.duration() ? (this.bufferedEnd() / this.duration()) * 100 : 0;
  }

  // --- Volume ---
  onVolumeChange(event: Event): void {
    this.setVolume(Number((event.target as HTMLInputElement).value));
  }

  private setVolume(value: number): void {
    const clamped = Math.min(Math.max(value, 0), 1);
    const video = this.videoRef.nativeElement;
    video.volume = clamped;
    video.muted = clamped === 0;
    this.volume.set(clamped);
    this.isMuted.set(video.muted);
  }

  toggleMute(): void {
    const video = this.videoRef.nativeElement;
    if (video.muted || video.volume === 0) {
      video.muted = false;
      video.volume = this.volume() > 0 ? this.volume() : 0.5;
      this.volume.set(video.volume);
      this.isMuted.set(false);
    } else {
      video.muted = true;
      this.isMuted.set(true);
    }
  }

  // --- Quality ---
  setQuality(label: string): void {
    this.showQualityMenu.set(false);
    if (label === this.selectedQuality()) return;
    const video = this.videoRef.nativeElement;
    this.pendingResume = { time: video.currentTime, wasPlaying: !video.paused };
    this.isLoading.set(true);
    this.selectedQuality.set(label); // template [src] binding swaps the file; onLoadedMetadata resumes position
  }

  // --- Speed ---
  setSpeed(rate: number): void {
    this.playbackRate.set(rate);
    this.videoRef.nativeElement.playbackRate = rate;
    this.showSpeedMenu.set(false);
  }

  // --- Fullscreen & PiP ---
  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.wrapperRef.nativeElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  togglePip(): void {
    const video = this.videoRef.nativeElement as HTMLVideoElement & {
      requestPictureInPicture?: () => Promise<unknown>;
    };
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else {
      video.requestPictureInPicture?.().catch(() => {});
    }
  }

  // --- Playlist navigation ---
  goNext(): void {
    const next = (this.currentIndex() + 1) % this.movies.length;
    this.router.navigate(['/watch', this.movies[next].id]);
  }

  goPrev(): void {
    const prev =
      (this.currentIndex() - 1 + this.movies.length) % this.movies.length;
    this.router.navigate(['/watch', this.movies[prev].id]);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  // --- Controls auto-hide ---
  onMouseMove(): void {
    this.showControls.set(true);
    this.resetHideTimer();
  }

  onMouseLeave(): void {
    if (this.isPlaying()) this.showControls.set(false);
  }

  private resetHideTimer(): void {
    if (this.hideControlsTimer) clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(() => {
      if (this.isPlaying()) this.showControls.set(false);
    }, 3000);
  }

  // --- Keyboard shortcuts ---
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.videoRef) return;
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowRight':
        this.seekBy(10);
        break;
      case 'ArrowLeft':
        this.seekBy(-10);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.setVolume(this.volume() + 0.1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.setVolume(this.volume() - 0.1);
        break;
      case 'KeyF':
        this.toggleFullscreen();
        break;
      case 'KeyM':
        this.toggleMute();
        break;
    }
  }

  formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }
}
