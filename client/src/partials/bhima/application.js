angular.module('bhima.controllers')
.controller('app', [
  'EVENTS',
  '$scope',
  '$location',
  '$translate',
  'appauth',
  'appcache',
  'appstate',
  'connect',
  'validate',
  'util',
  function (EVENTS, $scope, $location, $translate, appauth, Appcache, appstate, connect, validate, util) {
    var dependencies = {},
        preferences = new Appcache('preferences'),
        cache = new Appcache('application');

    function setEnvironmentVariable(key, data) {
      connect.fetch(data)
      .then(function (values) {
        appstate.set(key, values);
      });
    }

    function loadCachedLanguage() {
      //FIXME This could be done in util.js -
      // extra object (in this file) vs. the clarity
      // of doing all set up in one place
      preferences.fetch('language')
      .then(function (res) {
        if (res) { $translate.use(res.current); }
      })
      .catch(handleError);
    }

    function loadCachedLocation() {
      preferences.fetch('location')
      .then(function(res) {
        if (res) { $location.path(res.path); }
      })
      .catch(handleError);
    }

    // define dependencies for before login initially happens
    function beforeLogin() {
      var languages, enterprises, projects;
      console.log('[Loading] Application dependencies');

      languages = {
        tables : {
          'language' : { columns : ['id', 'name', 'key'] }
        }
      };

      // For future use
      enterprises = {
        tables : {
          'enterprise' : {
            columns : ['id', 'name', 'abbr', 'location_id', 'currency_id', 'phone', 'email']
          }
        }
      };

      projects = {
        tables : {
          'project' : { columns : ['id', 'name', 'enterprise_id', 'abbr'] }
        }
      };

      // set appstate variables
      setEnvironmentVariable('languages', languages);
      setEnvironmentVariable('enterprises', enterprises);
      setEnvironmentVariable('projects', projects);

      // load appcache variables
      var url = $location.url();
      if (url === '' || url === '/') { loadCachedLocation(); }
      loadCachedLanguage();

      // FIXME
      // Set DEPRECATED appstate values until we can change them in the future.
      appstate.register('enterprises', function (result) {
        var defaultEnterprise = result[0];
        if (defaultEnterprise) { appstate.set('enterprise', defaultEnterprise); }
      });
    }

    // Fires after login
    function afterLogin() {
      var currencies, exchangeRate, fiscalYear;

      exchangeRate = {
        'tables' : {
          'exchange_rate' : {
            'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']
          }
        },
        'where' : ['exchange_rate.date=' + util.sqlDate()]
      };

      fiscalYear = {
        'tables' : {
          'period' : { 'columns' : ['id', 'period_start', 'period_stop', 'fiscal_year_id'] },
          'fiscal_year' : { 'columns': ['fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year', 'enterprise_id'] }
        },
        join : ['period.fiscal_year_id=fiscal_year.id'],
        where : ['period.period_start<=' + util.sqlDate(), 'AND', 'period.period_stop>=' + util.sqlDate()]
      };

      currencies = {
        'tables' : {
          'currency' : {
            'columns' : ['id', 'name', 'symbol', 'min_monentary_unit']
          }
        }
      };

      // set appstate variables
      // TODO : Loading exchange rates should be moved into a service
      // where only the pages needing exchange rates load them.
      setEnvironmentVariable('exchange_rate', exchangeRate);
      setEnvironmentVariable('fiscalYears', fiscalYear);
      setEnvironmentVariable('currencies', currencies);
      
      // FIXME
      // set DEPRECATED appstate variables until we can change them
      // throughout the application.
      appstate.register('fiscalYears', function (data) {
        var currentFiscal = data[0];
        if (currentFiscal) {
          currentFiscal.period_id = currentFiscal.id;
          currentFiscal.id = currentFiscal.fiscal_year_id;
          appstate.set('fiscal', currentFiscal);
        }
      });
    }
  
    $scope.$on(EVENTS.auth.notAuthenticated, function (e) {
      console.log('Not Authenticated Event Fired!');
      beforeLogin();
      $location.path('/login');
    });

    $scope.$on(EVENTS.auth.sessionTimeout, function (e) {
      console.log('Session Timeout Event Fired!');
      $location.path('/login');
    });

    $scope.$on(EVENTS.auth.LoginSuccess, function (e) {
      console.log('Logged in successfully');
      afterLogin();
    });

    $scope.user = null;

    $scope.setUser = function (user) {
      $scope.user = user;
    };

    function handleError(error) {
      throw error;
    }
  }
]);
