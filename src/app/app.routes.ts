import { Routes } from '@angular/router';
import { authGuard } from './core/authguard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ), // lazy loading
  },

  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },
      {
        path:'movies',
        loadComponent: () =>
          import('./features/movies/movies/movies.component').then(
            (m) => m.MoviesComponent,
          ),
      },
      {
        path:'tvshows',
        loadComponent: () =>
          import('./features/tvshows/tvshows/tvshows.component').then(
            (m) => m.TvshowsComponent,
          ),
      },
      {
        path:'mylist',
        loadComponent: () =>
          import('./features/mylist/mylist/mylist.component').then(
            (m) => m.MylistComponent,
          ),
      },
      {
        path: 'watch/:id',
        loadComponent: () =>
          import('./features/watch/watch/watch.component').then(
            (m) => m.WatchComponent,
          ),
      },
    ],
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];
