import { Routes } from '@angular/router';
import { RestaurantsComponent } from './features/restaurants/restaurants.component';
import { CustomerRestaurantsComponent } from './features/customer/customer-restaurants.component';
import { RestaurantDashboardComponent } from './features/admin/restaurant-admin.component';
import { RestaurantManagementComponent } from './features/admin/restaurant-management.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { CustomerManagementComponent } from './features/admin/customer-management.component';
import { DashboardHomeComponent } from './features/admin/dashboard-home.component';
import { OrdersAdminComponent } from './features/admin/orders-admin.component';
import { DriversAdminComponent } from './features/admin/drivers-admin.component';
import { PaymentsAdminComponent } from './features/admin/payments-admin.component';
import { AnalyticsAdminComponent } from './features/admin/analytics-admin.component';
import { LoginComponent } from './features/auth/login.component';
import { RegistrationComponent } from './features/auth/registration.component';
import { GoogleCallbackComponent } from './features/auth/google-callback.component';
import { authGuard, roleGuard, guestGuard } from './core/auth/auth.guard';
import { RestaurantManagerDashboardComponent } from './features/restaurant-manager/restaurant-manager-dashboard.component';
import { WholesalerDashboardComponent } from './features/wholesaler/wholesaler-dashboard.component';
import { WholesalerOverviewComponent } from './features/wholesaler/wholesaler-overview.component';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { take } from 'rxjs/operators';
import { IssuesAdminComponent } from './features/admin/issues-admin.component';

// Simple redirect component for root route
@Component({
  template: '<div>Redirecting...</div>',
  standalone: true
})
class RootRedirectComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user && user.is_active) {
        // Redirect authenticated users based on their role
        if (user.role === 'app_admin' || user.role === 'admin') {
          this.router.navigate(['/admin'], { replaceUrl: true });
        } else if (user.role === 'manager') {
          this.router.navigate(['/restaurant-manager'], { replaceUrl: true });
        } else if (user.role === 'wholesaler') {
          this.router.navigate(['/wholesaler'], { replaceUrl: true });
        } else if (user.role === 'driver') {
          this.router.navigate(['/driver-dashboard'], { replaceUrl: true });
        } else {
          this.router.navigate(['/customer'], { replaceUrl: true });
        }
      } else {
        // Unauthenticated users go to customer route (public restaurant list)
        this.router.navigate(['/customer'], { replaceUrl: true });
      }
    });
  }
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: RootRedirectComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/driver-login', loadComponent: () => import('./features/auth/driver-login.component').then(m => m.DriverLoginComponent) },
  { path: 'auth/register', component: RegistrationComponent },
  { path: 'auth/verify-email', loadComponent: () => import('./features/auth/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'auth/callback', component: GoogleCallbackComponent },
  { path: 'auth/register-restaurant', loadComponent: () => import('./features/auth/restaurant-owner-registration.component').then(m => m.RestaurantOwnerRegistrationComponent) },
  { path: 'auth/register-wholesaler', loadComponent: () => import('./features/auth/wholesaler-registration.component').then(m => m.WholesalerRegistrationComponent) },
  { path: 'restaurant-registration', loadComponent: () => import('./features/restaurant-registration/restaurant-registration.component').then(m => m.RestaurantRegistrationComponent), canActivate: [authGuard, roleGuard(['manager'])] },
  { path: 'customer', component: CustomerRestaurantsComponent },
  { path: 'customer/filters', loadComponent: () => import('./features/customer/customer-filters.component').then(m => m.CustomerFiltersComponent) },
  { path: 'dashboard', loadComponent: () => import('./features/customer/dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent), canActivate: [authGuard, roleGuard(['customer'])] },
  { path: 'account-settings', loadComponent: () => import('./features/customer/account-settings/account-settings.component').then(m => m.AccountSettingsComponent), canActivate: [authGuard, roleGuard(['customer'])] },
  { path: 'report-issue/:orderId', loadComponent: () => import('./features/customer/report-issue/report-issue.component').then(m => m.ReportIssueComponent), canActivate: [authGuard, roleGuard(['customer'])] },
  { path: 'restaurant/:id', loadComponent: () => import('./features/restaurants/restaurant-detail.component').then(m => m.RestaurantDetailComponent) },
  { path: 'restaurants', component: RestaurantsComponent },
  { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent) },
  // Restaurant Onboarding
  { path: 'onboarding', loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
  { path: 'onboarding/continue', loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
  // Wholesaler Onboarding
  { path: 'wholesaler-onboarding', loadComponent: () => import('./features/onboarding/wholesaler-onboarding.component').then(m => m.WholesalerOnboardingComponent) },
  { path: 'wholesaler-onboarding/continue', loadComponent: () => import('./features/onboarding/wholesaler-onboarding.component').then(m => m.WholesalerOnboardingComponent) },
  // Stripe Connect onboarding redirects (legacy, kept for compatibility)
  { path: 'onboarding/refresh', loadComponent: () => import('./features/restaurant-manager/stripe-onboarding-redirect.component').then(m => m.StripeOnboardingRedirectComponent) },
  { path: 'onboarding/complete', loadComponent: () => import('./features/restaurant-manager/stripe-onboarding-redirect.component').then(m => m.StripeOnboardingRedirectComponent) },
  { path: 'order-confirmation/:id', loadComponent: () => import('./features/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent) },
  { path: 'table-order/:restaurantId/:tableNumber', loadComponent: () => import('./features/table-order/table-order.component').then(m => m.TableOrderComponent) },
  { path: 'review', loadComponent: () => import('./features/reviews/review-flow.component').then(m => m.ReviewFlowComponent) },
  { path: 'driver-activate/:token', loadComponent: () => import('./features/driver/driver-activation.component').then(m => m.DriverActivationComponent) },
  { path: 'driver-dashboard', loadComponent: () => import('./features/driver/driver-dashboard.component').then(m => m.DriverDashboardComponent), canActivate: [authGuard, roleGuard(['driver'])] },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard(['app_admin', 'admin', 'manager'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardHomeComponent },
      { path: 'customers', component: CustomerManagementComponent },
      { path: 'restaurants', component: RestaurantManagementComponent },
      { path: 'restaurant-dashboard', component: RestaurantDashboardComponent },
      { path: 'restaurant-registrations', loadComponent: () => import('./features/admin/admin-restaurant-registrations.component').then(m => m.AdminRestaurantRegistrationsComponent), canActivate: [roleGuard(['app_admin'])] },
      { path: 'wholesaler-registrations', loadComponent: () => import('./features/admin/admin-wholesaler-registrations.component').then(m => m.AdminWholesalerRegistrationsComponent), canActivate: [roleGuard(['app_admin'])] },
      { path: 'orders', component: OrdersAdminComponent },
      { path: 'drivers', component: DriversAdminComponent },
      { path: 'payments', component: PaymentsAdminComponent },
      { path: 'analytics', component: AnalyticsAdminComponent },
      { path: 'issues', component: IssuesAdminComponent, canActivate: [roleGuard(['app_admin'])] },
      { path: 'support-tickets', loadComponent: () => import('./features/admin/support-tickets-admin.component').then(m => m.SupportTicketsAdminComponent), canActivate: [roleGuard(['app_admin'])] }
    ]
  },
  {
    path: 'restaurant-manager',
    component: RestaurantManagerDashboardComponent,
    canActivate: [authGuard, roleGuard(['manager'])],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-overview.component').then(m => m.RestaurantManagerOverviewComponent) },
      { path: 'orders', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-orders.component').then(m => m.RestaurantManagerOrdersComponent) },
      { path: 'menu', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-menu.component').then(m => m.RestaurantManagerMenuComponent) },
      { path: 'drivers', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-drivers.component').then(m => m.RestaurantManagerDriversComponent) },
      { path: 'analytics', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-analytics.component').then(m => m.RestaurantManagerAnalyticsComponent) },
      { path: 'customers', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-customers.component').then(m => m.RestaurantManagerCustomersComponent) },
      { path: 'settings', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-settings.component').then(m => m.RestaurantManagerSettingsComponent) },
      { path: 'details', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-details.component').then(m => m.RestaurantManagerDetailsComponent) },
      { path: 'payment-methods', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-payment-methods.component').then(m => m.RestaurantManagerPaymentMethodsComponent) },
      { path: 'wholesale', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-wholesale.component').then(m => m.RestaurantManagerWholesaleComponent) },
      { path: 'wholesale/:id', loadComponent: () => import('./features/restaurant-manager/wholesaler-detail.component').then(m => m.WholesalerDetailComponent) },
      { path: 'tables', loadComponent: () => import('./features/restaurant-manager/restaurant-tables.component').then(m => m.RestaurantTablesComponent) },
      { path: 'tables/grid', loadComponent: () => import('./features/restaurant-manager/restaurant-table-grid.component').then(m => m.RestaurantTableGridComponent) },
      { path: 'invoices', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-invoices.component').then(m => m.RestaurantManagerInvoicesComponent) },
      { path: 'issues', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-issues.component').then(m => m.RestaurantManagerIssuesComponent) },
      { path: 'support', loadComponent: () => import('./features/restaurant-manager/restaurant-manager-support.component').then(m => m.RestaurantManagerSupportComponent) }
    ]
  },
  {
    path: 'wholesaler',
    component: WholesalerDashboardComponent,
    canActivate: [authGuard, roleGuard(['wholesaler'])],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: WholesalerOverviewComponent },
      { path: 'products', loadComponent: () => import('./features/wholesaler/wholesaler-products.component').then(m => m.WholesalerProductsComponent) },
      { path: 'orders', loadComponent: () => import('./features/wholesaler/wholesaler-orders.component').then(m => m.WholesalerOrdersComponent) },
      { path: 'analytics', loadComponent: () => import('./features/wholesaler/wholesaler-analytics.component').then(m => m.WholesalerAnalyticsComponent) },
      { path: 'profile', loadComponent: () => import('./features/wholesaler/wholesaler-profile.component').then(m => m.WholesalerProfileComponent) },
      { path: 'settings', loadComponent: () => import('./features/wholesaler/wholesaler-settings.component').then(m => m.WholesalerSettingsComponent) }
    ]
  }
];
