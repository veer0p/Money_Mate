import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private router: Router) {}

  redirectToSignup() {
    this.router.navigate(['/signup']);
  }

  calculateSavings() {
    const incomeInput = document.getElementById(
      'monthly-income'
    ) as HTMLInputElement;
    const expenseInput = document.getElementById(
      'monthly-expenses'
    ) as HTMLInputElement;
    const resultElement = document.getElementById('result');

    if (incomeInput && expenseInput && resultElement) {
      const income = parseFloat(incomeInput.value) || 0;
      const expenses = parseFloat(expenseInput.value) || 0;
      const savings = income - expenses;

      resultElement.textContent =
        savings >= 0
          ? `Your estimated savings: $${savings.toFixed(2)}`
          : `You're overspending by $${Math.abs(savings).toFixed(2)}!`;
    }
  }
}
