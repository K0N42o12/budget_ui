import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { Expense, ExpenseUpsertDto, ExpenseCriteria, Page, Category } from '../shared/domain';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.backendUrl}/expenses`;

  // Mock-Daten für Expenses
  private mockExpenses: Expense[] = [
    {
      id: '1',
      amount: 45.50,
      description: 'Weekly groceries',
      categoryId: '1',
      date: new Date('2025-11-08'),
      createdAt: new Date(),
      lastModifiedAt: new Date()
    },
    {
      id: '2',
      amount: 12.00,
      description: 'Bus ticket',
      categoryId: '2',
      date: new Date('2025-11-08'),
      createdAt: new Date(),
      lastModifiedAt: new Date()
    },
    {
      id: '3',
      amount: 25.99,
      description: 'Movie tickets',
      categoryId: '3',
      date: new Date('2025-11-09'),
      createdAt: new Date(),
      lastModifiedAt: new Date()
    },
    {
      id: '4',
      amount: 89.00,
      description: 'Electricity bill',
      categoryId: '4',
      date: new Date('2025-11-07'),
      createdAt: new Date(),
      lastModifiedAt: new Date()
    },
    {
      id: '5',
      amount: 150.00,
      description: 'Doctor visit',
      categoryId: '5',
      date: new Date('2025-11-06'),
      createdAt: new Date(),
      lastModifiedAt: new Date()
    }
  ];

  // Read - Get paginated expenses
  getExpenses = (criteria: ExpenseCriteria): Observable<Page<Expense>> => {
    if (environment.useMockData) {
      // Filter nach Kriterien
      let filtered = [...this.mockExpenses];

      // Filter nach Kategorie
      if (criteria.categoryId) {
        filtered = filtered.filter(e => e.categoryId === criteria.categoryId);
      }

      // Filter nach Datum (startDate und endDate)
      if (criteria.startDate) {
        filtered = filtered.filter(e => new Date(e.date) >= criteria.startDate!);
      }
      if (criteria.endDate) {
        filtered = filtered.filter(e => new Date(e.date) <= criteria.endDate!);
      }

      // Sortierung
      if (criteria.sort) {
        const [field, direction] = criteria.sort.split(',');
        filtered.sort((a, b) => {
          let aVal: any = a[field as keyof Expense];
          let bVal: any = b[field as keyof Expense];
          
          if (field === 'date' || field === 'createdAt') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
          }
          
          if (direction === 'desc') {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }

      // Pagination
      const page = criteria.page || 0;
      const size = criteria.size || 10;
      const start = page * size;
      const end = start + size;
      const paginatedContent = filtered.slice(start, end);

      const mockPage: Page<Expense> = {
        content: paginatedContent,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        size: size,
        number: page,
        last: end >= filtered.length  // ← WICHTIG für Infinite Scroll
      };

      return of(mockPage).pipe(delay(500));
    }

    // Echtes Backend
    return this.httpClient.get<Page<Expense>>(this.apiUrl, {
      params: new HttpParams({ fromObject: { ...criteria } as any })
    });
  }

  // Create & Update
  upsertExpense = (expense: ExpenseUpsertDto): Observable<void> => {
    if (environment.useMockData) {
      if (expense.id) {
        // Update
        const index = this.mockExpenses.findIndex(e => e.id === expense.id);
        if (index !== -1) {
          this.mockExpenses[index] = {
            ...this.mockExpenses[index],
            ...expense,
            lastModifiedAt: new Date()
          } as Expense;
        }
      } else {
        // Create
        const newExpense: Expense = {
          id: String(Date.now()),
          amount: expense.amount!,
          description: expense.description!,
          categoryId: expense.categoryId!,
          date: expense.date!,
          createdAt: new Date(),
          lastModifiedAt: new Date()
        };
        this.mockExpenses.push(newExpense);
      }
      return of(void 0).pipe(delay(500));
    }

    // Echtes Backend
    return this.httpClient.put<void>(this.apiUrl, expense);
  }

  // Delete
  deleteExpense = (id: string): Observable<void> => {
    if (environment.useMockData) {
      this.mockExpenses = this.mockExpenses.filter(e => e.id !== id);
      return of(void 0).pipe(delay(500));
    }

    // Echtes Backend
    return this.httpClient.delete<void>(`${this.apiUrl}/${id}`);
  }
}