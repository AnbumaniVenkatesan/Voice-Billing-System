import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomerService } from '../../shared/services/customer.service';
import { Customer, CustomerRequest } from '../../shared/models/models';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatInputModule, MatFormFieldModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <h2>Customer Management</h2>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Add Customer
      </button>
    </div>

    <div class="search-bar">
      <mat-form-field appearance="outline">
        <mat-label>Search customers</mat-label>
        <input matInput (keyup)="applyFilter($event)" placeholder="Search..." #input>
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
    </div>

    <div class="table-container" *ngIf="!showForm">
      <table mat-table [dataSource]="dataSource" matSort>
        <ng-container matColumnDef="customerId">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> ID </th>
          <td mat-cell *matCellDef="let row"> {{ row.customerId }} </td>
        </ng-container>

        <ng-container matColumnDef="customerName">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> Name </th>
          <td mat-cell *matCellDef="let row"> {{ row.customerName }} </td>
        </ng-container>

        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> Phone </th>
          <td mat-cell *matCellDef="let row"> {{ row.phone }} </td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> Email </th>
          <td mat-cell *matCellDef="let row"> {{ row.email }} </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Actions </th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button color="primary" (click)="editCustomer(row)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteCustomer(row.customerId)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons></mat-paginator>
    </div>

    <div class="form-card" *ngIf="showForm">
      <h3>{{ editingId ? 'Edit' : 'Add' }} Customer</h3>
      <form (ngSubmit)="saveCustomer()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Customer Name</mat-label>
          <input matInput [(ngModel)]="formData.customerName" name="customerName" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phone</mat-label>
          <input matInput [(ngModel)]="formData.phone" name="phone">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput [(ngModel)]="formData.email" name="email">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Address</mat-label>
          <textarea matInput [(ngModel)]="formData.address" name="address" rows="3"></textarea>
        </mat-form-field>

        <div class="form-actions">
          <button mat-button type="button" (click)="cancelForm()">Cancel</button>
          <button mat-raised-button color="primary" type="submit">Save</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .search-bar { margin-bottom: 16px; }
    .search-bar mat-form-field { width: 300px; }
    .table-container { overflow: auto; background: white; border-radius: 8px; margin-bottom: 40px; }
    table { width: 100%; }
    .form-card { background: white; padding: 24px; border-radius: 8px; max-width: 600px; }
    .full-width { width: 100%; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  `]
})
export class CustomerComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['customerId', 'customerName', 'phone', 'email', 'actions'];
  dataSource = new MatTableDataSource<Customer>();
  showForm = false;
  editingId: number | null = null;
  formData: CustomerRequest = { customerName: '', phone: '', email: '', address: '' };

  constructor(
    private customerService: CustomerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openForm(): void {
    this.showForm = true;
    this.editingId = null;
    this.formData = { customerName: '', phone: '', email: '', address: '' };
  }

  editCustomer(customer: Customer): void {
    this.showForm = true;
    this.editingId = customer.customerId;
    this.formData = {
      customerName: customer.customerName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address
    };
  }

  saveCustomer(): void {
    if (this.editingId) {
      this.customerService.updateCustomer(this.editingId, this.formData).subscribe({
        next: () => {
          this.snackBar.open('Customer updated successfully', 'Close', { duration: 3000 });
          this.loadCustomers();
          this.cancelForm();
        },
        error: (err) => this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 3000 })
      });
    } else {
      this.customerService.createCustomer(this.formData).subscribe({
        next: () => {
          this.snackBar.open('Customer created successfully', 'Close', { duration: 3000 });
          this.loadCustomers();
          this.cancelForm();
        },
        error: (err) => this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 3000 })
      });
    }
  }

  deleteCustomer(id: number): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.snackBar.open('Customer deleted', 'Close', { duration: 3000 });
          this.loadCustomers();
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }
}
