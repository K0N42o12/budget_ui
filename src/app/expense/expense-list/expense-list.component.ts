import { Component, inject, signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { add, calendar, pricetag, search, swapVertical, personCircle, chevronForward, chevronBack } from 'ionicons/icons';
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
  IonFooter,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonButton,
  IonChip,
  IonSkeletonText,
  IonItemDivider,
  IonMenuButton,
  IonGrid,
  IonRow,
  IonCol,
  ModalController
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
    IonFooter,
    IonFab,
    IonFabButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonButton,
    IonChip,
    IonSkeletonText,
    IonItemDivider,
    IonMenuButton,
    IonGrid,
    IonRow,
    IonCol
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
  currentMonth = new Date();
  currentMonthDisplay = this.formatMonth(this.currentMonth);
  showSearch = false;

  constructor() {
    addIcons({ add, calendar, pricetag, search, swapVertical, personCircle, chevronForward, chevronBack });
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
      const dateKey = new Date(expense.date).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
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
      const dateKey = new Date(expense.date).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
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

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchTerm = '';
      this.onSearchClear();
    }
  }

  onSearchInput(event: any): void {
    this.searchTerm = event.detail.value || '';
    this.filterExpenses();
  }

  onSearchClear(): void {
    this.searchTerm = '';
    this.groupExpensesByDate();
  }

  previousMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.currentMonthDisplay = this.formatMonth(this.currentMonth);
    // TODO: Filter expenses by month
    console.log('Previous month:', this.currentMonthDisplay);
  }

  nextMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.currentMonthDisplay = this.formatMonth(this.currentMonth);
    // TODO: Filter expenses by month
    console.log('Next month:', this.currentMonthDisplay);
  }

  formatMonth(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
}