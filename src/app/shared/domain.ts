// Category
export interface Category {
  id?: string;
  name: string;
  createdAt?: Date;
  lastModifiedAt?: Date;
}

export interface CategoryUpsertDto {
  id?: string;
  name?: string;
}

export interface CategoryCriteria {
  page?: number;
  size?: number;
  sort?: string;
}

export interface AllCategoryCriteria {
  sort?: string;
  name?: string;
}

// Sort Option (für UI)
export interface SortOption {
  label: string;
  value: string;
}

// Page (Generic Pagination)
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Expense
export interface Expense {
  id?: string;
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
  createdAt?: Date;
  lastModifiedAt?: Date;
}

export interface ExpenseUpsertDto {
  id?: string;
  amount?: number;
  description?: string;
  categoryId?: string;
  date?: Date;
}

export interface ExpenseCriteria {
  page?: number;
  size?: number;
  sort?: string;
  categoryId?: string;
  fromDate?: Date;
  toDate?: Date;
}