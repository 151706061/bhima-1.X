var q = require('q');

module.exports = function(db, parser, journal, uuid) {
  'use strict';

  function execute(data, userId, callback) {
    return writePrimary(data.primary)
      .then(function () {
        return writeItem(data.primary_details);
      })
      .then(function () {
        return writeToJournal(data.primary.uuid, userId, data.other)
      })
      .then(function(){ 
        var res = {};
        callback(null, res);
      })
      .catch(function (err) {
        callback(err, null);
      });
  }

  function writePrimary (primary) {
    return db.exec(generate ('primary_cash', primary));
  }

  function writeItem (details) {
    return db.exec(generate ('primary_cash_item', details));
  }

  function writeToJournal (id, userId, details) {
    var deferred = q.defer();
    journal.request('tax_payment', id, userId, function (error, result) {
      if (error) {
        return deferred.reject(error);
      }
      return deferred.resolve(result);
    }, undefined, details);
    return deferred.promise;
  }

  function generate (table, data) {
    return parser.insert(table, data);
  }
  return { execute : execute };
};
