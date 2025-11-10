import { Component, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, calendar, pricetag, search, swapVertical } from 'ionicons/icons';
import { Expense, Category, ExpenseCriteria } from '../../shared/domain';
import { ExpenseService } from '../expense.service';
import { CategoryService } from '../../category/category.service';
import { ToastService } from '../../shared/service/toast.service';
import ExpenseModalComponent from '../expense-modal/expense-modal.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Ionic Imports
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonChip,
  IonSkeletonText
} from '@ionic/angular/standalone';

interface GroupedExpenses {
  date: string;
  expenses: Expense[];
  total: number;
}

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonChip,
    IonSkeletonText
  ]
})
export default class ExpenseListComponent {
  // DI
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);

  // State
  expenses = signal<Expense[]>([]);
  categories = signal<Category[]>([]);
  groupedExpenses = signal<GroupedExpenses[]>([]);
  loading = signal(false);
  
  // Filter
  searchTerm = '';
  selectedCategoryId = '';
  sortBy = 'date,desc';

  constructor() {
    addIcons({ add, calendar, pricetag, search, swapVertical });
    this.loadCategories();
    this.loadExpenses();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: categories => this.categories.set(categories),
      error: error => this.toastService.displayWarningToast('Could not load categories', error)
    });
  }

  loadExpenses(): void {
    this.loading.set(true);
    
    const criteria: ExpenseCriteria = {
      page: 0,
      size: 100,
      sort: this.sortBy
    };

    if (this.selectedCategoryId) {
      criteria.categoryId = this.selectedCategoryId;
    }

    this.expenseService.getExpenses(criteria).subscribe({
      next: page => {
        this.expenses.set(page.content);
        this.groupExpensesByDate();
        this.loading.set(false);
      },
      error: error => {
        this.toastService.displayWarningToast('Could not load expenses', error);
        this.loading.set(false);
      }
    });
  }

  groupExpensesByDate(): void {
    const expenses = this.expenses();
    const grouped = new Map<string, Expense[]>();

    expenses.forEach(expense => {
      const dateKey = new Date(expense.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(expense);
    });

    const result: GroupedExpenses[] = Array.from(grouped.entries()).map(([date, expenses]) => ({
      date,
      expenses,
      total: expenses.reduce((sum, e) => sum + e.amount, 0)
    }));

    this.groupedExpenses.set(result);
  }

  async openExpenseModal(expense?: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { expense }
    });

    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'refresh') {
      this.loadExpenses();
    }
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value || '';
    this.filterExpenses();
  }

  onCategoryChange(event: any): void {
    this.selectedCategoryId = event.detail.value || '';
    this.loadExpenses();
  }

  onSortChange(event: any): void {
    this.sortBy = event.detail.value;
    this.loadExpenses();
  }

  filterExpenses(): void {
    if (!this.searchTerm) {
      this.groupExpensesByDate();
      return;
    }

    const filtered = this.expenses().filter(expense =>
      expense.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    const grouped = new Map<string, Expense[]>();
    filtered.forEach(expense => {
      const dateKey = new Date(expense.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(expense);
    });

    const result: GroupedExpenses[] = Array.from(grouped.entries()).map(([date, expenses]) => ({
      date,
      expenses,
      total: expenses.reduce((sum, e) => sum + e.amount, 0)
    }));

    this.groupedExpenses.set(result);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  getTotalAmount(): number {
    return this.expenses().reduce((sum, e) => sum + e.amount, 0);
  }
}