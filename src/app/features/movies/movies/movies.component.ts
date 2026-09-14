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
  id: number;
  title: string;
  folder: string; // must match the folder name under assets/movies exactly
  poster: string; // filename inside that folder, e.g. 'poster.png'
  progress?: number;
}

interface ContentRow {
  title: string;
  items: Movie[];
}

//Replace with data from your .NET catalog API — folder/poster must match what's on disk

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.css'],
})
export class MoviesComponent implements OnInit, OnDestroy {
  isScrolled = signal(true);
  isMuted = signal(true);
  showProfileMenu = signal(false);

  profileletter: any;
  userid: any;
  username: any;
  roleid: any;
  email: any;
  menus: any;

  MOVIE_CATALOG: Movie[] = [];

  featuredMovies: Movie[] = [];

  currentFeaturedIndex = signal(0);
  heroVisible = signal(true);

  rows: ContentRow[] = [];

  private heroTimer?: ReturnType<typeof setInterval>;

  // currentFeatured = computed(() => {
  //   const movies = this.featuredMovies;

  //   if (movies.length === 0) {
  //     return null;
  //   }

  //   return movies[this.currentFeaturedIndex() % movies.length];
  // });
  currentFeatured = computed(
    () => this.featuredMovies[this.currentFeaturedIndex()],
  );

  constructor(
    private router: Router,
    private service: AdminService,
  ) {}

  ngOnInit(): void {
    this.userid = Number(localStorage.getItem('userid'));
    this.username = localStorage.getItem('username') || '';
    this.roleid = Number(localStorage.getItem('roleid'));
    this.email = localStorage.getItem('email') || '';

    if (this.username) {
      this.profileletter = this.username.charAt(0).toUpperCase();
    }

    this.GetMovies();
    this.GetMenus();
  }

  GetMenus(): void {
    this.service.GetMenus().subscribe({
      next: (res) => {
        this.menus = res;
        console.log('Menus:', this.menus);
      },
      error: (err) => {
        console.error('Menus error:', err);
      },
    });
  }

  GetMovies(): void {
    this.service.GetMovies().subscribe({
      next: (res: any[]) => {
        console.log('Movie API response:', res);

        this.MOVIE_CATALOG = res.map((item) => ({
          id: item.movieId,
          title: item.movieName,
          folder: item.moviePath,
          poster: 'poster.png',
          progress: 0,
        }));

        console.log('Movie catalog:', this.MOVIE_CATALOG);

        // Build featured movies AFTER API response
        this.featuredMovies = this.MOVIE_CATALOG.slice(0, 5);

        // Build rows AFTER API response
        this.rows = [
          {
            title: 'Continue watching',
            items: this.withProgress(this.MOVIE_CATALOG.slice(0, 8)),
          },
          {
            title: 'Trending now',
            items: this.MOVIE_CATALOG.slice(0, 8),
          },
          {
            title: 'New releases',
            items: [...this.MOVIE_CATALOG].reverse().slice(0, 8),
          },
          {
            title:
              this.MOVIE_CATALOG.length > 0
                ? 'Because you watched ' + this.MOVIE_CATALOG[0].title
                : 'Recommended for you',
            items: this.MOVIE_CATALOG.slice(0, 8),
          },
        ];

        // Start hero slider only after movies exist
        this.startHeroSlider();
      },

      error: (err) => {
        console.error('GetMovies error:', err);
      },
    });
  }

  private startHeroSlider(): void {
    if (this.featuredMovies.length <= 1) {
      return;
    }

    this.heroTimer = setInterval(() => {
      this.heroVisible.set(false);

      setTimeout(() => {
        this.currentFeaturedIndex.update(
          (i) => (i + 1) % this.featuredMovies.length,
        );

        this.heroVisible.set(true);
      }, 400);
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 40);
  }

  posterUrl(movie: Movie): string {
    return `/assets/movies/${movie.folder}/poster.jpg`;
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
    const movie = this.currentFeatured();

    if (!movie) {
      return;
    }

    this.router.navigate(['/watch', movie.id]);
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
