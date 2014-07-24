angular.module('bhima.controllers')
.controller('profitCenterAnalyse', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  'validate',
  '$translate',
  function ($scope, connect, appstate, messenger, validate, $translate) {

    var dependencies = {};

    dependencies.profit_centers = {
      query : {
        tables : {
          'profit_center' : {
            columns : ['id', 'text', 'note', 'project_id']
          },
          'project' : {
            columns :['abbr']
          }
        },
        join : ['profit_center.project_id=project.id']
      }
    }

    $scope.register = {};
    $scope.selected = {};

    function init(model) {
      $scope.model = model;
    }

    function setAction(value, profit_center) {
      $scope.action = value;
      $scope.selected = angular.copy(profit_center) || {};
    }

    function writeCenter() {
      return connect.basicPut('profit_center', connect.clean($scope.register));
    }

    function saveRegistration() {
      $scope.register.project_id = $scope.project.id;
      writeCenter()
      .then(function() {
        validate.refresh(dependencies, ['profit_centers']).then(function (model) {
          angular.extend($scope, model);
        });
        $scope.register = {};
        messenger.success($translate.instant('ANALYSIS_PROFIT_CENTER.INSERT_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.danger($translate.instant('ANALYSIS_PROFIT_CENTER.INSERT_FAIL_MESSAGE'));
      });
    }

    function remove(profit_center) {
      $scope.selected = angular.copy(profit_center);
      removeProfitCenter()
      .then(function () {
        $scope.model.profit_centers.remove($scope.selected.id);
        messenger.success($translate.instant('ANALYSIS_PROFIT_CENTER.REMOVE_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.danger($translate.instant('ANALYSIS_PROFIT_CENTER.REMOVE_FAIL_MESSAGE'));
      });
    }

    function edit() {
      delete $scope.selected.abbr;
      updateProfitCenter()
      .then(function () {
        // FIXME just add employee to model
        $scope.model.profit_centers.put($scope.selected);
        messenger.success($translate.instant('ANALYSIS_PROFIT_CENTER.UPDATE_SUCCESS_MESSAGE'));
      })
      .catch(function () {
        messenger.danger($translate.instant('ANALYSIS_PROFIT_CENTER.UPDATE_FAIL_MESSAGE'));
      });
    }

    function removeProfitCenter() {
      return connect.basicDelete('profit_center', [$scope.selected.id], 'id');
    }

    function updateProfitCenter() {
      return connect.basicPost('profit_center', [connect.clean($scope.selected)], ['id']);
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.profit_centers.where = ['profit_center.project_id='+project.id];
      validate.process(dependencies).then(init);
    });

    $scope.setAction = setAction;
    $scope.saveRegistration = saveRegistration;
    $scope.remove = remove;
    $scope.edit = edit;
  }
]);
