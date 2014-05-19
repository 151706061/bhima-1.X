angular.module('kpk.controllers')
.controller('transfert', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'validate',
  'appstate',
  'util',
  'exchange',
  'uuid',
  '$routeParams',
  '$location',
  function ($scope, $q, connect, messenger, validate, appstate, util, exchange, uuid, $routeParams, $location) {

    //inits and declarations
    var dependencies = {}, configuration = {};
    $scope.data= {};
    configuration.cash_box_id = $routeParams.cashbox_id;

    dependencies.project = {
      required : true,
      query : {
        tables : {
          'project' : {
            columns : ['id', 'name', 'abbr', 'enterprise_id']
          }
        }
      }
    };

    dependencies.pcash_module = {
      required : true,
      query : {
        tables : {
          'primary_cash_module' : {
            columns : ['id']
          }
        },
        where : ['primary_cash_module.text='+'transfert']
      }
    };

    dependencies.summers = {
      query :'pcash_transfert_summers',
      identifier : 'reference'
    };

    dependencies.cash_box = {
      required : true,
      query : {
        tables : {
          'cash_box' : {
            columns : ['id', 'text', 'project_id']
          }
        },
        where : ['cash_box.is_auxillary='+1]
      }
    };

    dependencies.cashAccounCurrency = {
      required : true,
      query : {
        tables : {
          'cash_box_account_currency' : {
            columns : ['id', 'currency_id', 'cash_box_id', 'account_id']
          }
        }
      }
    };

    dependencies.currency = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'name', 'symbol', 'min_monentary_unit']
          }
        }
      }
    };

    dependencies.cashier = {
      query : 'user_session'
    };

    //fonctions
    function init (model) {
      $scope.model = model;
      $scope.view = model;
      configuration.enterprise = $scope.enterprise;
      configuration.currency = getCurrency(configuration.enterprise.currency_id);
      configuration.module_id = model.pcash_module.data[0].id;
      window.model = $scope.model;
    }

    function commitCash (){
      validate.refresh(dependencies, ['cash_box']).then(function(model){
        $scope.view.cash_box.data = model.cash_box.data.filter(function (item) {
          return item.project_id == $scope.data.project_id;
        });
        configuration.project_id = $scope.data.project_id;
      });
    }

    function getCurrency (value){
      var currency = {};
      for (var i = $scope.model.currency.data.length - 1; i >= 0; i -= 1) {
        if ($scope.model.currency.data[i].id === value) {
          currency = $scope.model.currency.data[i];
          break;
        }
      }
      return currency;
    }

    function commitConfig () {
      configuration.cash_box_source_id = $scope.data.cash_box_id;
      updateInfoCashBox(configuration.cash_box_source_id, configuration.currency.id);
    }

    function updateInfoCashBox (cash_box_source_id, currency_id) {
      if(!cash_box_source_id || !currency_id) {
        messenger.danger('Erreur pendant le chargement');
        return;
      }
      configuration.cash_account_currency = $scope.model.cashAccounCurrency.data.filter(function (item) {
        return item.cash_box_id == configuration.cash_box_source_id &&
          item.currency_id == configuration.currency.id;
      });
    }

    function updateConfig(){
      configuration.symbol = $scope.data.currency.symbol;
      configuration.currency_id = $scope.data.currency.id;
    }

    function handleError (err) {
      messenger.danger(err.toString());
      return;
    }

    function convert(value, currency_id){
      if(!(value && currency_id)) return;
      return exchange.myExchange(value, currency_id);
    }

    function isValid(){
      var clean = true;
      if(!configuration) return false;
      if(!configuration.value) return false;
      for (var k in configuration){
        clean = clean && (k) ? true : false;
      }
      return (clean && ($scope.data.value) ? true : false);
    }

    function ajouter (){
      configuration.value = $scope.data.value;

      if(!isValid()) return;

      writeTransfer()
      .then(writeItem)
      .then(postToJournal)
      .then(function (prom){
        console.log('[prom]', prom, configuration);
        $location.path('/invoice/pcash_transfert/' + configuration.pcash.uuid);
      })
      .catch(handleError);
    }

    function writeItem (result){
      window.result = result;
      var item = {
        uuid : uuid(),
        primary_cash_uuid : result.config.data.data.uuid,
        debit : configuration.value,
        credit : 0
      };
      return connect.basicPut('primary_cash_item', [item]);
    }

    function refresh(){
      configuration = {};
      validate.refresh(dependencies, ['summers'])
      .then(init)
      .catch(handleError);
    }

    function writeTransfer (){
      var pcash = {
        uuid : uuid(),
        project_id : configuration.project_id,
        type : 'E',
        date : util.convertToMysqlDate(new Date().toISOString().slice(0,10)),
        currency_id : configuration.currency.id,
        account_id : configuration.cash_account_currency[0].account_id,
        cost : configuration.value,
        user_id : $scope.model.cashier.data.id,
        description : 'CT/'+new Date().toString(),
        cash_box_id : configuration.cash_box_id,
        origin_id   : configuration.module_id
      };
      configuration.pcash=pcash;
      return connect.basicPut('primary_cash', connect.clean(pcash));
    }

    function postToJournal (res) {
      return connect.fetch('/journal/transfert/' + configuration.pcash.uuid);
    }

    function commitConfiguration (){
      configuration.currency_id = $scope.data.currency_id;
    }

    function loadPath(path) {
      //TODO validate both correct path and cashbox
      $location.path(path + configuration.cashbox);
    }

    //invocations
    appstate.register('project', function(project){
      //FIX ME : I think there is a good way to do it
      appstate.register('enterprise', function (enterprise) {
        $scope.project = project;
        $scope.enterprise = enterprise;
        validate.process(dependencies, ['project', 'cash_box', 'cashAccounCurrency', 'currency', 'cashier', 'pcash_module', 'summers'])
        .then(init)
        .catch(handleError);
      });
    });

    $scope.$watch('data.currency', function (nv){
      if (nv) {
        configuration.currency = JSON.parse(nv);
        updateInfoCashBox(configuration.cash_box_source_id, configuration.currency.id);
      }
    }, true);

    //expositions
    $scope.loadPath = loadPath;
    $scope.commitCash = commitCash;
    $scope.commitConfiguration = commitConfiguration;
    $scope.commitConfig = commitConfig;
    $scope.commitCash = commitCash;
    $scope.ajouter = ajouter;
    $scope.configuration = configuration;
    $scope.updateConfig = updateConfig;
  }
]);