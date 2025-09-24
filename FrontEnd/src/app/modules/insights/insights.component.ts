import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { InsightsService, InsightsData } from '../../Service/insights.service';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.scss'
})
export class InsightsComponent implements OnInit {
  insightsData: InsightsData | null = null;
  isLoading = true;
  userId: string | null = null;

  constructor(private insightsService: InsightsService) {}

  ngOnInit() {
    this.userId = localStorage.getItem('userId');
    if (this.userId) {
      this.loadInsights();
    } else {
      console.error('User ID not found in localStorage');
      this.isLoading = false;
    }
  }

  loadInsights() {
    if (!this.userId) return;
    
    this.isLoading = true;
    this.insightsService.getInsightsData(this.userId).subscribe({
      next: (response) => {
        this.insightsData = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading insights:', error);
        this.isLoading = false;
      }
    });
  }
}
