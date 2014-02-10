angular.module('kpk.controllers')
.controller('message', function ($scope, $timeout, messenger) {
  // This binds the message service to the DOM
  'use strict';

  $scope.messages = messenger.messages;
  $scope.close = messenger.close;

});
