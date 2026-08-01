import { Routes } from '@angular/router';
import { authGuard, superAdminGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './features/layout/layout.component';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductDetailsComponent } from './features/dashboard/product-details.component';
import { TodaySalesComponent } from './features/dashboard/today-sales.component';
import { MonthlySalesComponent } from './features/dashboard/monthly-sales.component';
import { ProductComponent } from './features/product/product.component';
import { BillingComponent } from './features/billing/billing.component';
import { VoiceBillingComponent } from './features/voice-billing/voice-billing.component';
import { InvoiceListComponent } from './features/billing/invoice-list.component';
import { ReportsComponent } from './features/reports/reports.component';
import { CompanySettingsComponent } from './features/company-settings/company-settings.component';
import { AdminCompaniesComponent } from './features/admin/admin-companies.component';
import { AdminUsersComponent } from './features/admin/admin-users.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'dashboard/products', component: ProductDetailsComponent },
      { path: 'dashboard/today-sales', component: TodaySalesComponent },
      { path: 'dashboard/monthly-sales', component: MonthlySalesComponent },
      { path: 'products', component: ProductComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'voice-billing', component: VoiceBillingComponent },
      { path: 'invoices', component: InvoiceListComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'company-settings', component: CompanySettingsComponent },
      { path: 'admin/companies', component: AdminCompaniesComponent, canActivate: [superAdminGuard] },
      { path: 'admin/users', component: AdminUsersComponent, canActivate: [superAdminGuard] },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
