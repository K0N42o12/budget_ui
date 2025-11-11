import { Component, inject, Input, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, ViewDidEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, save, trash, calendar, pricetag, text, addCircle } from 'ionicons/icons';
import { Expense, ExpenseUpsertDto, Category } from '../../shared/domain';
import { ExpenseService } from '../expense.service';
import { CategoryService } from '../../category/category.service';
import { ToastService } from '../../shared/service/toast.service';
import { LoadingIndicatorService } from '../../shared/service/loading-indicator.service';
import { finalize } from 'rxjs';
import CategoryModalComponent from '../../category/category-modal/category-modal.component';
import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonDatetime, 
  IonDatetimeButton, 
  IonModal
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonTitle, 
    IonContent, 
    IonItem, 
    IonInput, 
    IonSelect, 
    IonSelectOption, 
    IonDatetime, 
    IonDatetimeButton, 
    IonModal, 
    ReactiveFormsModule
  ]
})
export default class ExpenseModalComponent implements ViewDidEnter {
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly loadingIndicatorService = inject(LoadingIndicatorService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);
  
  @Input() expense?: Expense;
  @ViewChild('descriptionInput') descriptionInput?: IonInput;
  
  categories: Category[] = [];
  isSaving = false;
  
  readonly expenseForm = this.formBuilder.group({
    id: [undefined as string | undefined],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.maxLength(200)]],
    categoryId: [''],
    date: [new Date().toISOString(), Validators.required]
  });

  constructor() {
    addIcons({ close, save, trash, calendar, pricetag, text, addCircle });
    this.loadCategories();
  }

  ionViewDidEnter(): void {
    if (this.expense) {
      this.expenseForm.patchValue({
        id: this.expense.id,
        amount: this.expense.amount,
        description: this.expense.description,
        categoryId: this.expense.categoryId,
        date: new Date(this.expense.date).toISOString()
      });
    }
    // Focus on description input after a short delay
    setTimeout(() => this.descriptionInput?.setFocus(), 300);
  }

  loadCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: categories => this.categories = categories,
      error: error => this.toastService.displayWarningToast('Could not load categories', error)
    });
  }

  async openCategoryModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CategoryModalComponent
    });

    await modal.present();

    const { role, data } = await modal.onWillDismiss();
    
    if (role === 'refresh') {
      this.loadCategories();
      
      if (data?.categoryId) {
        setTimeout(() => {
          this.expenseForm.patchValue({
            categoryId: data.categoryId
          });
        }, 300);
      }
    }
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.toastService.displayWarningToast('Please fill all required fields');
      return;
    }
    
    this.isSaving = true;
    
    this.loadingIndicatorService.showLoadingIndicator({ message: 'Saving expense' }).subscribe(loadingIndicator => {
      const formValue = this.expenseForm.value;
      const expense: ExpenseUpsertDto = {
        id: formValue.id || undefined,
        amount: formValue.amount || undefined,
        description: formValue.description || undefined,
        categoryId: formValue.categoryId || undefined,
        date: formValue.date ? new Date(formValue.date) : undefined
      };
      
      this.expenseService.upsertExpense(expense).pipe(
        finalize(() => {
          loadingIndicator.dismiss();
          this.isSaving = false;
        })
      ).subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Expense saved');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: error => {
          console.error('Error saving expense:', error);
          this.toastService.displayWarningToast('Could not save expense. Please try again.', error);
        }
      });
    });
  }

  delete(): void {
    if (!this.expense?.id) return;
    
    this.isSaving = true;
    
    this.loadingIndicatorService.showLoadingIndicator({ message: 'Deleting expense' }).subscribe(loadingIndicator => {
      this.expenseService.deleteExpense(this.expense!.id!).pipe(
        finalize(() => {
          loadingIndicator.dismiss();
          this.isSaving = false;
        })
      ).subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Expense deleted');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: error => {
          console.error('Error deleting expense:', error);
          this.toastService.displayWarningToast('Could not delete expense. Please try again.', error);
        }
      });
    });
  }

  get isEditMode(): boolean {
    return !!this.expense;
  }
}