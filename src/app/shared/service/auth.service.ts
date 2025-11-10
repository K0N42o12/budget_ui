import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  email: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  isAuthenticated = signal<boolean>(false);

  constructor(private router: Router) {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
      this.isAuthenticated.set(true);
    }
  }

  login(email: string, password: string): Observable<boolean> {
    // TODO: Replace with real API call
    // For now, accept any email/password
    return new Observable(observer => {
      setTimeout(() => {
        if (email && password) {
          const user: User = {
            email: email,
            token: 'mock-jwt-token-' + Date.now()
          };
          
          // Store user in localStorage
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          // Update state
          this.currentUserSubject.next(user);
          this.isAuthenticated.set(true);
          
          observer.next(true);
          observer.complete();
        } else {
          observer.error('Invalid credentials');
        }
      }, 500); // Simulate API delay
    });
  }

  logout(): void {
    // Remove user from localStorage
    localStorage.removeItem('currentUser');
    
    // Update state
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    
    // Navigate to login
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }
}