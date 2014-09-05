(function (angular) {
  'use strict';

  var bhima = angular.module('bhima', ['bhima.controllers', 'bhima.services', 'bhima.directives', 'bhima.filters', 'ngRoute', 'ui.bootstrap', 'pascalprecht.translate']);

  function bhimaconfig($routeProvider) {
    //TODO: Dynamic routes loaded from unit database?
    $routeProvider.
    when('/budgeting/:accountID?', {
      controller: 'budget',
      templateUrl: 'partials/budget/budget.html'
    })
    .when('/project', {
      controller : 'project',
      templateUrl: 'partials/project/project.html'
    })
    .when('/permission', {
      controller: 'permission',
      templateUrl: 'partials/user_permission/permissions.html'
    })
    .when('/enterprise', {
      controller: 'enterprise',
      templateUrl: 'partials/enterprise/enterprise.html'
    })
    .when('/posting_journal', {
      controller: 'journal.grid',
      templateUrl:'partials/journal/journal.html'
    })
    .when('/projects', {
      controller : 'project',
      templateUrl : 'partials/projects/projects.html'
    })
    .when('/fiscal', {
      controller: 'fiscal',
      templateUrl: 'partials/fiscal/fiscal.html'
    })
    .when('/patient', {
      controller: 'patientRegistration',
      templateUrl: 'partials/patient_registration/patient.html'
    })
    .when('/debitor/debitor_group', {
      controller : 'debitorGroup',
      templateUrl: 'partials/debitor/debitor_group.html'
    })
    .when('/journal_voucher', {
      controller: 'journalVoucher',
      templateUrl: 'partials/journal_voucher/journal_voucher.html'
    })
    .when('/inventory', {
      controller: 'inventory',
      templateUrl: '/partials/inventory/inventory.html'
    })
    .when('/inventory/view', {
      controller : 'inventoryView',
      templateUrl:'/partials/inventory/view/view.html'
    })
    .when('/inventory/register', {
      controller: 'inventoryRegister',
      templateUrl: '/partials/inventory/register/register.html'
    })
    .when('/inventory/update', {
      controller : 'inventory.update',
      templateUrl : 'partials/inventory/update_item/update_item.html'
    })
    .when('/inventory/groups', {
      controller : 'inventory.groups',
      templateUrl : 'partials/inventory/groups/groups.html'
    })
    .when('/inventory/types',  {
      controller : 'inventory.types',
      templateUrl : 'partials/inventory/types/types.html'
    })
    .when('/inventory/manifest', {
      controller : 'inventory.manifest',
      templateUrl : 'partials/inventory/manifest/manifest.html'
    })
    .when('/patient_records/:patientID?', {
      controller: 'patientRecords',
      templateUrl: '/partials/records/patient_records/patient_records.html'
    })
    .when('/sales/:debtorID?/:inventoryID?', {
      controller: 'sales',
      templateUrl: '/partials/sales/sales.html'
    })
    .when('/sale_records/:recordID?', {
      controller: 'salesRecords',
      templateUrl: '/partials/records/sales_records/sales_records.html'
    })
    .when('/cash', {
      controller: 'cash',
      templateUrl: '/partials/cash/cash.html'
    })
    .when('/creditor', {
      controller: 'creditors',
      templateUrl: '/partials/creditor/creditor.html'
    })
    .when('/creditors/creditor_group', {
      controller: 'creditorGroup',
      templateUrl: 'partials/creditor/group/creditor_group.html'
    }).
    when('/purchase/create/', {
      controller: 'purchaseOrder',
      templateUrl: 'partials/purchase/create/purchase.html'
    })
    .when('/purchase/view/', {
      controller: 'purchaseRecords',
      templateUrl: 'partials/purchase/view/purchase_records.html'
    })
    .when('/purchase/confirm/', {
      controller: 'purchaseConfirm',
      templateUrl: 'partials/purchase/confirm/confirm.html'
    })
    .when('/inventory/price_list', {
      controller: 'priceList',
      templateUrl: 'partials/price_list/pricelist.html'
    })
    .when('/exchange_rate', {
      controller : 'exchangeRate',
      templateUrl: 'partials/exchange_rate/exchange_rate.html'
    })
    .when('/currency', {
      controller : 'currency',
      templateUrl: 'partials/currency/currency.html'
    })
    .when('/create_account', {
      controller: 'manageAccount',
      templateUrl: 'partials/accounts/create_account/create.html'
    })
    .when('/reports/finance', {
      controller: 'reportFinance',
      templateUrl: 'partials/reports/finance/finance_report.html'
    })
    .when('/reports/patient_group/:uuid', {
      controller : 'report.patientGroup',
      templateUrl : 'partials/reports/patient_group/patient_group.html'
    })
    .when('/reports/prices', {
      controller : 'report.prices',
      templateUrl : 'partials/reports/prices/prices.html'
    })
    .when('/reports/transactions/account', {
      controller : 'report.transactions.account',
      templateUrl : 'partials/reports/transactions/account.html'
    })
    .when('/reports/transaction_report', {
      controller: 'reportTransaction',
      templateUrl: 'partials/reports/transaction_report/transaction_report.html'
    })
    .when('/reports/patient_standing/', {
      controller : 'reportPatientStanding',
      templateUrl : '/partials/reports/patient_standing/patient_standing.html'
    })
    .when('/reports/ledger/general_ledger', {
      controller: 'reportGeneralLedger',
      templateUrl: '/partials/reports/ledger/general_ledger.html'
    })
    .when('/reports/summary', {
      controller: 'summary',
      templateUrl: 'partials/reports/summary/summary.html'
    })
    .when('/reports/debitor_aging/', {
      controller: 'reportDebitorAging',
      templateUrl: 'partials/reports/debitor_aging/debitor_aging.html'
    })
    .when('/reports/account_statement/:id?', {
      controller: 'accountStatement',
      templateUrl: 'partials/reports/account_statement/account_statement.html'
    })
    .when('/reports/income_expensive/', {
      controller: 'reportIncomeExpensive',
      templateUrl: 'partials/reports/income_expensive/income_expensive.html'
    })
    .when('/location', {
      controller : 'location',
      templateUrl: 'partials/location/location.html'
    })
    .when('/location/village', {
      controller : 'village',
      templateUrl: 'partials/location/village/village.html'
    })
    .when('/location/sector', {
      controller : 'sector',
      templateUrl: 'partials/location/sector/sector.html'
    })
    .when('/location/province', {
      controller : 'province',
      templateUrl: 'partials/location/province/province.html'
    })
    .when('/location/country', {
      controller : 'country',
      templateUrl: 'partials/location/country/country.html'
    })
    .when('/print', {
      templateUrl: 'partials/print/test.html'
    })
    .when('/settings/:route?', {
      controller: 'settings',
      templateUrl: 'partials/settings/settings.html'
    })
    .when('/patient_group_assignment', {
      controller: 'AssignPatientGroup',
      templateUrl: 'partials/patient_group_assignment/patient_group_assign.html'
    })
    .when('/reports/chart_of_accounts/', {
      controller: 'accountsReport',
      templateUrl: 'partials/reports/chart_of_accounts/chart.html'
    })
    .when('/invoice/:originId/:invoiceId', {
      controller: 'receipts',
      templateUrl: 'partials/receipts/receipts.html'
    })
    .when('/credit_note/:invoiceId?/', {
      controller: 'creditNote',
      templateUrl: 'partials/credit_note/credit_note.html'
    })
    .when('/cost_center', {
      controller: 'costCenter',
      templateUrl: 'partials/cost_center/cost_center.html'
    })
    .when('/profit_center', {
      controller: 'profitCenter',
      templateUrl: 'partials/profit_center/profit_center.html'
    })
    .when('/profit_center/center/', {
      controller: 'profitCenterAnalyse',
      templateUrl: 'partials/profit_center/center/analysis_profit_center.html'
    })
    .when('/cost_center/center/', {
      controller: 'analysisCenter',
      templateUrl: 'partials/cost_center/center/analysis_center.html'
    })
    .when('/cost_center/assigning/', {
      controller: 'costCenter.assigning',
      templateUrl: 'partials/cost_center/assigning/assigning.html'
    })
    .when('/cost_center/allocation/', {
      controller: 'costCenter.allocation',
      templateUrl: 'partials/cost_center/allocation/allocation.html'
    })
    .when('/profit_center/allocation/', {
      controller: 'profitCenter.allocation',
      templateUrl: 'partials/profit_center/allocation/allocation.html'
    })
    .when('/patient_group', {
      controller: 'patientGroup',
      templateUrl: 'partials/patient_group/patient_group.html'
    })
    .when('/group_invoice/:id?', {
      controller : 'groupInvoice',
      templateUrl : 'partials/group_invoice/group_invoice.html'
    })
    .when('/reports/patient_registrations', {
      controller : 'reportPatientRegistrations',
      templateUrl : 'partials/reports/patient_registrations/patient_registrations.html'
    })
    .when('/reports/cash_payments', {
      controller: 'reportCashPayments',
      templateUrl: 'partials/reports/cash_payments/cash_payments.html'
    })
    .when('/swap_debitor', {
      controller : 'swapDebitor',
      templateUrl : 'partials/swap_debitor/swap_debitor.html'
    })
    .when('/reports/all_transactions', {
      controller : 'allTransactions',
      templateUrl : 'partials/reports/all_transactions/all_transactions.html'
    })
    .when('/reports/expiring', {
      controller : 'expiring',
      templateUrl : 'partials/reports/expiring_stock/expiring_stock.html'
    })
    .when('/caution', {
      controller : 'caution',
      templateUrl : 'partials/caution/caution.html'
    })
    .when('/primary_cash/transfert/:cashbox_id', {
      controller : 'primaryCash.income.transfer',
      templateUrl : 'partials/primary_cash/income/transfer/transfer.html'
    })
     .when('/primary_cash/convention/:cashbox_id', {
      controller : 'convention',
      templateUrl : 'partials/primary_cash/income/convention/convention.html'
    })
    .when('/primary_cash/income/generic/:id', {
      controller : 'primaryCash.income.generic',
      templateUrl : 'partials/primary_cash/income/generic/generic.html'
    })
    .when('/trialbalance/print', {
      controller : 'trialbalance.print',
      templateUrl : 'partials/journal/trialbalance/print.html'
    })
    .when('/primary_cash/', {
      controller : 'primaryCash',
      templateUrl : 'partials/primary_cash/primary.html'
    })
    .when('/employee', {
      controller : 'employee',
      templateUrl : 'partials/employee/employee.html'
    })
    .when('/service', {
      controller : 'admin.service',
      templateUrl : 'partials/service/service.html'
    })
    .when('/journal/print', {
      controller : 'journal.print',
      templateUrl : 'partials/journal/print.html'
    })
    .when('/primary_cash/expense/generic/:id?', {
      controller : 'primaryCash.expense.generic',
      templateUrl: 'partials/primary_cash/expense/generic.html'
    })
    .when('/primary_cash/expense/purchase/:cashbox', {
      controller : 'purchaseOrderCash',
      templateUrl : 'partials/primary_cash/expense/purchase.html'
    })
    .when('/inventory/depot', {
      controller : 'inventory.depot',
      templateUrl : 'partials/inventory/depot/depot.html'
    })
    .when('/stock/', {
      controller : 'stock.main',
      templateUrl : 'partials/stock/stock.html'
    })
    .when('/stock/entry/start/:depotId', {
      controller : 'stock.entry.start',
      templateUrl : 'partials/stock/entry/start.html'
    })
    .when('/stock/entry/partition', {
      controller : 'stock.entry.partition',
      templateUrl : 'partials/stock/entry/partition.html'
    })
    .when('/stock/movement/:depotId', {
      controller : 'stock.movement',
      templateUrl : 'partials/stock/movement/movement.html'
    })
    .when('/stock/distribution/:depotId', {
      controller : 'stock.distribution',
      templateUrl : 'partials/stock/exit/distribution.html'
    })
    .when('/stock/distribution_service/:depotId', {
      controller : 'stock.distribution_service',
      templateUrl : 'partials/stock/exit_service/distribution_service.html'
    })
    .when('/stock/loss/:depotId', {
      controller : 'stock.loss',
      templateUrl : 'partials/stock/loss/loss.html'
    })
    .when('/stock/entry/report/:documentId?', {
      controller : 'stock.entry.report',
      templateUrl : 'partials/stock/entry/report.html'
    })
    .when('/stock/search/', {
      controller : 'stock.search',
      templateUrl: 'partials/stock/search/search.html'
    })
    .when('/stock/count/', {
      controller : 'stock.count',
      templateUrl : 'partials/stock/count/count.html'
    })
    .when('/stock/expiring/:depotId', {
      controller : 'stock.expiring',
      templateUrl : 'partials/stock/expiring/expiring.html'
    })
    .when('/inventory/distribution/:depotId?', {
      controller : 'inventory.distribution',
      templateUrl : 'partials/inventory/distribution/distribution.html'
    })
    .when('/snis/', {
      controller : 'snis',
      templateUrl : 'partials/snis/snis.html'
    })	
    .when('/purchase_menu/', {
      controller : 'purchase.menu',
      templateUrl : 'partials/purchase/purchase_menu.html'
    })
    .when('/reports/income_report/', {
      controller : 'primary_cash.incomeReport',
      templateUrl : 'partials/reports/primary_cash/income/income_report.html'
    })
    .when('/reports/expense_report/', {
      controller : 'primary_cash.expenseReport',
      templateUrl : 'partials/reports/primary_cash/expense/expense_report.html'
    })
    .when('/grade_employers/', {
      controller : 'grade',
      templateUrl : 'partials/grade_employers/grade_employers.html'
    })
    .when('/rubriques_payroll/', {
      controller : 'rubriques_payroll',
      templateUrl : 'partials/rubriques_payroll/rubriques_payroll.html'
    });
  }

  function translateConfig($translateProvider) {
    //TODO Review i18n and determine if this it the right solution/grade_employers/
    $translateProvider.useStaticFilesLoader({
      prefix: '/i18n/',
      suffix: '.json'
    });

    //TODO Try and assign the previous sessions language key here
    $translateProvider.preferredLanguage('fr');
  }

  bhima.config(['$routeProvider', bhimaconfig]);
  bhima.config(['$translateProvider', translateConfig]);
})(angular);
