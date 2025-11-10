import { Routes } from '@angular/router';
import { categoriesPath } from './category/category.routes';
import { expensesPath } from './expense/expense.routes';
import { authGuard } from './shared/guard/auth.guard';

export const defaultPath = expensesPath;

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: defaultPath,
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component')
  },
  {
    path: categoriesPath,
    loadChildren: () => import('./category/category.routes'),
    canActivate: [authGuard]
  },
  {
    path: expensesPath,
    loadChildren: () => import('./expense/expense.routes'),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: defaultPath
  }
];

export default appRoutes;