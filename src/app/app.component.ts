import { Component, inject, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { analytics, logOut, podium, pricetag, personCircle } from 'ionicons/icons';
import { categoriesPath } from './category/category.routes';
import { expensesPath } from './expense/expense.routes';
import { AuthService } from './shared/service/auth.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonAvatar
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    // Ionic
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonLabel,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonRouterOutlet,
    IonAvatar
  ]
})
export default class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  
  currentUserEmail = '';
  
  readonly appPages = [
    { title: 'Expenses', url: `/${expensesPath}`, icon: 'podium' },
    { title: 'Categories', url: `/${categoriesPath}`, icon: 'pricetag' }
  ];

  constructor() {
    // Add all used Ionic icons
    addIcons({ analytics, logOut, podium, pricetag, personCircle });
  }

  ngOnInit(): void {
    // Subscribe to current user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUserEmail = user?.email || 'Guest';
    });
  }

  logout(): void {
    this.authService.logout();
  }
}