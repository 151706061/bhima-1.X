angular.module('bhima.controllers')
.controller('project', [
  '$scope',
  '$window',
  'validate',
  'connect',
  'messenger',
  'appstate',
  function ($scope, $window, validate, connect, messenger, appstate) {
    var dependencies = {};
    $scope.action = '';
    $scope.timestamp = new Date();

    dependencies.projects = {
      query : {
        tables : {
          'project' : {
            columns : ['id', 'name', 'abbr', 'enterprise_id']
          }
        }
      }
    };

    dependencies.enterprises = {
      query : {
        tables : {
          'enterprise' : {
            columns : ['id', 'name', 'abbr']
          }
        }
      }
    };

    function handleErrors(err) {
      messenger.danger('An Error occured : ' + err);
    }

    function load(models) {
      for (var k in models) { $scope[k] = models[k]; }
    }

    $scope.print = function print() {
      $window.print();
    };

    $scope.new = function n() {
      $scope.newProject = {};
      $scope.action = 'new';
    };

    $scope.submitNew = function submitNew() {
      var clean = connect.clean($scope.newProject);
      connect.basicPut('project', [clean])
      .success(function (res) {
        clean.id = res.insertId;
        $scope.projects.post(clean);
        $scope.action = 'default';
      })
      .error(handleErrors);
    };

    $scope.cancelNew = function canceNew() {
      $scope.newProject = {};
    };

    $scope.edit = function edit(project) {
      $scope.editProject = angular.copy(project);
      $scope.raw = project;
      $scope.action = 'edit';
    };

    $scope.submitEdit = function submitEdit() {
      var clean = connect.clean($scope.editProject);
      connect.basicPost('project', [clean], ['id'])
      .success(function () {
        $scope.projects.put(clean);
        $scope.action = 'default';
      })
      .error(handleErrors);
    };

    $scope.cancelEdit = function cancelEdit() {
      $scope.editProject = angular.copy($scope.raw);
      $scope.action = 'edit';
    };

    $scope.delete = function d(project) {
      connect.basicDelete('project', project.id, 'id')
      .success(function () {
        $scope.projects.remove(project.id);
      })
      .error(function (error) {
        messenger.danger('An error occurred : ' + error);
      });
    };

    appstate.register('project', function (project) {
      $scope.currentProject = project;
      dependencies.projects.query.where =
        ['project.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies)
      .then(load, handleErrors);
    });
  }
]);
