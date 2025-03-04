import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  sidebarClosed: boolean = false; // Sidebar is open by default

  constructor(private router: Router) {}

  toggleSidebar() {
    this.sidebarClosed = !this.sidebarClosed; // Toggle open/close state
  }

  logout() {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }
}
