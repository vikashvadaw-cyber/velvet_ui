import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

interface ContentItem {
  title: string;
  seed: string;
  progress?: number;
}

interface ContentRow {
  title: string;
  items: ContentItem[];
}

interface ContentItem {
  id: string;
  title: string;
  seed: string;
  progress?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  isScrolled = signal(false);
  isMuted = signal(true);
  showProfileMenu = signal(false);

  rows: ContentRow[] = [
    { title: 'Continue watching', items: this.buildItems('continue', 6, true) },
    { title: 'Trending now', items: this.buildItems('trending', 10) },
    { title: 'New releases', items: this.buildItems('newrelease', 10) },
    {
      title: 'Because you watched Midnight Marquee',
      items: this.buildItems('recommend', 10),
    },
  ];

  profileletter: any;
  userid: any;
  username: any;
  roleid: any;
  email: any;
  menus: any;

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
  }

  async GetMenus() {
    this.menus = this.service.GetMenus().subscribe({
      next: (res) => {
        this.menus = res;
        console.log('Menus:- ', this.menus);
      },
      error: (err) => {
        console.log('menus error:- ', err);
      },
    });
  }

  navigate(routepath: any): void {
    this.route.navigate(['/home']);
  }
  // ...inside the class:
  featuredId = 'midnight-marquee';

  playFeatured(): void {
    this.router.navigate(['/watch', this.featuredId]);
  }

  play(item: ContentItem): void {
    this.router.navigate(['/watch', item.id]);
  }

  private buildItems(
    prefix: string,
    count: number,
    withProgress = false,
  ): ContentItem[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-${i + 1}`,
      title: `Title ${i + 1}`,
      seed: `${prefix}${i + 1}`,
      progress: withProgress ? Math.floor(20 + Math.random() * 70) : undefined,
    }));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 40);
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

  scrollRow(track: HTMLDivElement, direction: number): void {
    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: 'smooth',
    });
  }

  // private buildItems(
  //   prefix: string,
  //   count: number,
  //   withProgress = false,
  // ): ContentItem[] {
  //   return Array.from({ length: count }, (_, i) => ({
  //     title: `Title ${i + 1}`,
  //     seed: `${prefix}${i + 1}`,
  //     progress: withProgress ? Math.floor(20 + Math.random() * 70) : undefined,
  //   }));
  // }
}
