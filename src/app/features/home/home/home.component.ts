import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

interface Movie {
  id: string;
  title: string;
  folder: string; // must match the folder name under assets/movies exactly
  poster: string; // filename inside that folder, e.g. 'poster.png'
  progress?: number;
}

interface ContentRow {
  title: string;
  items: Movie[];
}

// Replace with data from your .NET catalog API — folder/poster must match what's on disk
const MOVIE_CATALOG: Movie[] = [
  {
    id: 'bahubali1',
    title: 'Bahubali-The Begining',
    folder: 'Bahubali-The Begining',
    poster: 'poster.jpg',
  },
  {
    id: 'bahubali2',
    title: 'Bahubali-The Conclusion',
    folder: 'Bahubali-The Conclusion',
    poster: 'poster.jpg',
  },
  {
    id: 'ironman',
    title: 'Iron Man',
    folder: 'Iron Man',
    poster: 'poster.jpg',
  },
  {
    id: 'johnwick',
    title: 'John Wick',
    folder: 'John Wick',
    poster: 'poster.jpg',
  },
  {
    id: 'avengersinfinitywar',
    title: 'Avengers-Infinity War',
    folder: 'Avengers-Infinity War',
    poster: 'poster.jpg',
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  isScrolled = signal(true);
  isMuted = signal(true);
  showProfileMenu = signal(false);

  profileletter: any;
  userid: any;
  username: any;
  roleid: any;
  email: any;
  menus: any[] = [];

  featuredMovies = MOVIE_CATALOG.slice(0, 5);
  currentFeaturedIndex = signal(0);
  heroVisible = signal(true);

  currentFeatured = computed(
    () => this.featuredMovies[this.currentFeaturedIndex()],
  );

  rows: ContentRow[] = [
    {
      title: 'Continue watching',
      items: this.withProgress(MOVIE_CATALOG.slice(3, 9)),
    },
    { title: 'Trending now', items: MOVIE_CATALOG.slice(0, 8) },
    { title: 'New releases', items: [...MOVIE_CATALOG].reverse().slice(0, 8) },
    {
      title: 'Because you watched ' + MOVIE_CATALOG[0].title,
      items: MOVIE_CATALOG.slice(4, 12),
    },
  ];

  private heroTimer?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private service: AdminService,
    private route: Router,
  ) {}

  ngOnInit(): void {
    this.userid = Number(localStorage.getItem('userid'));
    this.username = localStorage.getItem('username') || '';
    this.roleid = Number(localStorage.getItem('roleid'));
    this.email = Number(localStorage.getItem('email')) || '';
    if (this.username) {
      this.profileletter = this.username.charAt(0).toUpperCase();
    }
    this.GetMenus();
    this.heroTimer = setInterval(() => {
      this.heroVisible.set(false);
      setTimeout(() => {
        this.currentFeaturedIndex.update(
          (i) => (i + 1) % this.featuredMovies.length,
        );
        this.heroVisible.set(true);
      }, 400); // must match the CSS transition duration
    }, 5000);
  }

  async GetMenus() {
    this.service.GetMenus().subscribe({
      next: (res: any[]) => {
        this.menus = res;
        console.log('Menus:- ', this.menus);
      },
      error: (err) => {
        console.log('menus error:- ', err);
      },
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.heroTimer);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 40);
  }

  posterUrl(movie: Movie): string {
    return `/assets/movies/${movie.folder}/${movie.poster}`;
  }

  toggleMute(): void {
    this.isMuted.update((v) => !v);
  }

  toggleProfileMenu(): void {
    this.showProfileMenu.update((v) => !v);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }

  playFeatured(): void {
    this.router.navigate(['/watch', this.currentFeatured().id]);
  }

  play(movie: Movie): void {
    this.router.navigate(['/watch', movie.id]);
  }

  scrollRow(track: HTMLDivElement, direction: number): void {
    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: 'smooth',
    });
  }

  private withProgress(movies: Movie[]): Movie[] {
    return movies.map((m) => ({
      ...m,
      progress: Math.floor(20 + Math.random() * 70),
    }));
  }
}
