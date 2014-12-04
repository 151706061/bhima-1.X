// TODO Debtor table currently has no personal information - this strictly ties debtors to patients
// (or some existing table) - a reverse lookup from debtor / creditor ID to recipient is needed.
angular.module('bhima.controllers')
.controller('receipts', [
  '$scope',
  '$routeParams',
  '$q',
  '$http',
  'validate',
  'exchange',
  'appstate',
  'util',
  'connect',
  function ($scope, $routeParams, $q, $http, validate, exchange, appstate, util, connect) {
    var templates,
      dependencies = {},
      origin = $routeParams.originId,
      invoiceId = $routeParams.invoiceId,
      commonData = $q.defer();

    if (!(origin && invoiceId)) { throw new Error('Invalid parameters'); }

    appstate.set('receipts.commonData', commonData.promise);

    dependencies.location = {};
    dependencies.enterprise = {
      query : {
        tables : {
          'enterprise' : {columns : ['id', 'name', 'phone', 'email', 'location_id' ]},
          'project'    : {columns : ['name', 'abbr']}
        },
        join : ['enterprise.id=project.enterprise_id']
      }
    };

    templates = {
      'caution' : {
        url : '/partials/receipts/templates/receipt_caution.html'
      },
      'transfer' : {
        url : '/partials/receipts/templates/receipt_transfer.html'
      }//,
      // 'cash' : {
      //   url : '/partials/receipts/templates/cash.html'
      // },
      // 'sale' : {
      //   url : '/partials/receipts/templates/sale.html'
      // },
      // 'credit' : {
      //   url : '/partials/receipts/templates/credit.html'
      // },
      // 'patient' : {
      //   url : '/partials/receipts/templates/patient.html'
      // },
      // 'purchase' : {
      //   url : '/partials/receipts/templates/purchase.html'
      // },
      // 'pcash_convention' : {
      //   url : '/partials/receipts/templates/convention.html'
      // },
      // 'movement' : {
      //   url : '/partials/receipts/templates/movement.html'
      // },
      // 'consumption' : {
      //   url : '/partials/receipts/templates/consumption.html'
      // },
      // 'indirect_purchase' : {
      //   url : '/partials/receipts/templates/indirect.purchase.html'
      // },
      // 'confirm_purchase' : {
      //   url : '/partials/receipts/templates/confirm.purchase.html'
      // },
      // 'service_distribution' : {
      //   url : '/partials/receipts/templates/distribution.html'
      // },
      // 'generic_income' : {
      //   url : '/partials/receipts/templates/generic.income.html'
      // },
      // 'generic_expense' : {
      //   url : '/partials/receipts/templates/generic.income.html'
      // },
      // 'loss' : {
      //   url : '/partials/receipts/templates/loss.html'
      // },
      // 'payslip' : {
      //   url : '/partials/receipts/templates/payslip.html'
      // },
      // 'payroll' : {
      //   url : '/partials/receipts/templates/payroll.html'
      // },
      // 'cotisation_paiement' : {
      //   url : '/partials/receipts/templates/cotisation_paiement.html'
      // },
      // 'tax_payment' : {
      //   url : '/partials/receipts/templates/tax_payment.html'
      // }                        
    };

    function convert (value, currency_id, date) {
      return value / exchange.rate(value, currency_id, date);
    }

    function expose (data) {
      $scope.template = templates[origin];
      data.origin = origin;
      data.invoiceId = invoiceId;
      data.convert = convert;
      commonData.resolve(data);
    }

    appstate.register('project', function (project) {
      dependencies.enterprise.query.where = ['project.id=' + project.id];
      dependencies.location.query = '/location/village/' + project.location_id;
      validate.process(dependencies)
      .then(expose);
    });
  }
]);
