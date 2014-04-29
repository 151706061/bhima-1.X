angular.module('kpk.controllers')
.controller('updateStock', function ($scope, $filter, validate, connect, messenger) {
  var dependencies = {}, selectedStock;
  var session = $scope.session = {
    search: true
  };

  dependencies.inventory = {
    query : {
      identifier : 'uuid',
      tables : {
        inventory : { columns : ['uuid', 'code', 'text', 'price', 'purchase_price', 'group_uuid', 'unit_id'] }
      }
    }
  };

  dependencies.history = {
    query : {
      tables : {
        inventory_log : {
          columns : ['uuid', 'log_timestamp', 'price', 'code', 'text']
        }
      }
    }
  };

  validate.process(dependencies, ['inventory']).then(updateStock);

  function updateStock(model) {
    $scope.model = model;
  }

  function selectStock(uuid) {
    selectedStock = $scope.selectedStock = $scope.model.inventory.get(uuid);
    $scope.cachePrice = angular.copy(selectedStock.price);
    $scope.cachePurchasePrice = angular.copy(selectedStock.purchase_price);
  }

  function loadStock(id) {
    session.search = false;
    dependencies.history.query.where = ['inventory_log.inventory_uuid=' + selectedStock.uuid];
    validate.refresh(dependencies, ['history']);

    // dependencies.history.when = ['inventory_id=' + id];
    // validate.process(dependencies).then(displayHistory);
  }

  // function displayHistory(model) {}

  function refreshSession() {
    session.search = true;
    selectedStock = $scope.selectedStock = null;
    $scope.session.stockSearch = '';
  }

  function submitUpdate() {
    var updateLine = connect.clean(selectedStock);

    // basic validation
    if(isNaN(Number(updateLine.price))) return messenger.danger($filter('translate')('UPDATE_STOCK.INVALID_PRICE'));

    // if(updateLine.code==='') return messenger.danger($filter('translate')('UPDATE_STOCK.INVALID_CODE'));
    // if(updateLine.text==='') return messenger.danger($filter('translate')('UPDATE_STOCK.INVALID_TEXT'));

    connect.basicPost('inventory', [updateLine], ['uuid']).then(function (res) {
      messenger.success($filter('translate')('UPDATE_STOCK.UPDATE_SUCCESS'));
      $scope.cachePrice = angular.copy(selectedStock.price);
      $scope.cachePurchasePrice = angular.copy(selectedStock.purchase_price);
      validate.refresh(dependencies, ['history']);
    }, function (err) {
      messenger.danger($filter('translate')('UPDATE_STOCK.UPDATE_FAILUER'));
    });
  }

  $scope.loadStock = loadStock;
  $scope.selectStock = selectStock;
  $scope.refreshSession = refreshSession;
  $scope.submitUpdate = submitUpdate;
});
