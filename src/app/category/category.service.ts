import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { AllCategoryCriteria, Category, CategoryCriteria, CategoryUpsertDto, Page } from '../shared/domain';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.backendUrl}/categories`;
  private readonly apiV2Url = `${environment.backendUrl}/v2/categories`;

  // Mock-Daten
  private mockCategories: Category[] = [
    { id: '1', name: 'Groceries', createdAt: new Date(), lastModifiedAt: new Date() },
    { id: '2', name: 'Transport', createdAt: new Date(), lastModifiedAt: new Date() },
    { id: '3', name: 'Entertainment', createdAt: new Date(), lastModifiedAt: new Date() },
    { id: '4', name: 'Utilities', createdAt: new Date(), lastModifiedAt: new Date() },
    { id: '5', name: 'Healthcare', createdAt: new Date(), lastModifiedAt: new Date() }
  ];

  // Read
  getCategories = (pagingCriteria: CategoryCriteria): Observable<Page<Category>> => {
    if (environment.useMockData) {
      // Mock-Response
      const mockPage: Page<Category> = {
        content: this.mockCategories,
        totalElements: this.mockCategories.length,
        totalPages: 1,
        size: 10,
        number: 0
      };
      return of(mockPage).pipe(delay(500));
    }
    
    return this.httpClient.get<Page<Category>>(this.apiUrl, { 
      params: new HttpParams({ fromObject: { ...pagingCriteria } }) 
    });
  }

  getAllCategories = (sortCriteria: AllCategoryCriteria): Observable<Category[]> => {
    if (environment.useMockData) {
      return of([...this.mockCategories]).pipe(delay(300));
    }
    
    return this.httpClient.get<Category[]>(this.apiV2Url, { 
      params: new HttpParams({ fromObject: { ...sortCriteria } }) 
    });
  }

  // Create & Update
  upsertCategory = (category: CategoryUpsertDto): Observable<void> => {
    if (environment.useMockData) {
      if (category.id) {
        // Update
        const index = this.mockCategories.findIndex(c => c.id === category.id);
        if (index !== -1) {
          this.mockCategories[index] = { 
            ...this.mockCategories[index],
            ...category,
            lastModifiedAt: new Date()
          } as Category;
        }
      } else {
        // Create
        const newCategory: Category = {
          id: String(Date.now()),
          name: category.name!,
          createdAt: new Date(),
          lastModifiedAt: new Date()
        };
        this.mockCategories.push(newCategory);
      }
      return of(void 0).pipe(delay(500));
    }
    
    return this.httpClient.put<void>(this.apiUrl, category);
  }

  // Delete
  deleteCategory = (id: string): Observable<void> => {
    if (environment.useMockData) {
      this.mockCategories = this.mockCategories.filter(c => c.id !== id);
      return of(void 0).pipe(delay(500));
    }
    
    return this.httpClient.delete<void>(`${this.apiUrl}/${id}`);
  }
}