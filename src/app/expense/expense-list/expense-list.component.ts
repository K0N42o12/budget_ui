import { Component, inject, signal, ViewChild } from '@angular/core';
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
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonProgressBar,
  ModalController,
  InfiniteScrollCustomEvent
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
    IonCol,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonProgressBar
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
  loadingMore = signal(false);
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  hasMoreData = true;
  
  // Filter
  searchTerm = '';
  selectedCategoryId = '';
  sortBy = 'date,desc';
  currentMonth = new Date();
  currentMonthDisplay = this.formatMonth(this.currentMonth);
  showSearch = false;

  @ViewChild(IonInfiniteScroll) infiniteScroll?: IonInfiniteScroll;

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

  loadExpenses(append: boolean = false): void {
    if (!append) {
      this.loading.set(true);
      this.currentPage = 0;
      this.hasMoreData = true;
    } else {
      this.loadingMore.set(true);
    }
    
    const criteria: ExpenseCriteria = {
      page: this.currentPage,
      size: this.pageSize,
      sort: this.sortBy
    };

    if (this.selectedCategoryId) {
      criteria.categoryId = this.selectedCategoryId;
    }

    // Filter by current month
    const startOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const endOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0, 23, 59, 59);
    
    criteria.startDate = startOfMonth;
    criteria.endDate = endOfMonth;

    this.expenseService.getExpenses(criteria).subscribe({
      next: page => {
        if (append) {
          const currentExpenses = this.expenses();
          this.expenses.set([...currentExpenses, ...page.content]);
        } else {
          this.expenses.set(page.content);
        }
        
        this.hasMoreData = !page.last;
        this.groupExpensesByDate();
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: error => {
        this.toastService.displayWarningToast('Could not load expenses', error);
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  loadMoreExpenses(event: InfiniteScrollCustomEvent): void {
    if (!this.hasMoreData) {
      event.target.complete();
      return;
    }

    this.currentPage++;
    
    const criteria: ExpenseCriteria = {
      page: this.currentPage,
      size: this.pageSize,
      sort: this.sortBy
    };

    if (this.selectedCategoryId) {
      criteria.categoryId = this.selectedCategoryId;
    }

    // Filter by current month
    const startOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const endOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0, 23, 59, 59);
    
    criteria.startDate = startOfMonth;
    criteria.endDate = endOfMonth;

    this.expenseService.getExpenses(criteria).subscribe({
      next: page => {
        const currentExpenses = this.expenses();
        this.expenses.set([...currentExpenses, ...page.content]);
        this.hasMoreData = !page.last;
        this.groupExpensesByDate();
        event.target.complete();
      },
      error: error => {
        this.toastService.displayWarningToast('Could not load more expenses', error);
        event.target.complete();
      }
    });
  }

  handleRefresh(event: any): void {
    this.currentPage = 0;
    this.loadExpenses();
    setTimeout(() => {
      event.target.complete();
    }, 500);
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
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.currentMonthDisplay = this.formatMonth(this.currentMonth);
    this.loadExpenses();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.currentMonthDisplay = this.formatMonth(this.currentMonth);
    this.loadExpenses();
  }

  formatMonth(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
}