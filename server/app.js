#!/usr/local/bin/node

// import node dependencies
var express      = require('express'),
    https        = require('https'),
    fs           = require('fs'),
    url          = require('url'),
    compress     = require('compression'),
    bodyParser   = require('body-parser'),
    session      = require('express-session'),
    cookieParser = require('cookie-parser');

// import configuration
var cfg = require('./config/server.json'),
    errorCodes = require('./config/errors.json'),
    options = { key : fs.readFileSync(cfg.tls.key, 'utf8'), cert : fs.readFileSync(cfg.tls.cert, 'utf8') };

// import lib dependencies
var parser       = require('./lib/parser')(),
    uuid         = require('./lib/guid'),
    logger       = require('./lib/logger')(cfg.log, uuid),
    db           = require('./lib/db')(cfg.db, logger, uuid),
    sanitize     = require('./lib/sanitize'),
    util         = require('./lib/util'),
    validate     = require('./lib/validate')(),
    store        = require('./lib/store'),
    liberror     = require('./lib/liberror')();

// import middleware
var authorize    = require('./middleware/authorization')(cfg.auth.paths),
    authenticate = require('./middleware/authentication')(db, sanitize),
    projects     = require('./middleware/projects')(db);

// import routes
var report            = require('./routes/report')(db, sanitize, util),
    trialbalance      = require('./routes/trialbalance')(db, sanitize, util, uuid),
    ledger            = require('./routes/ledger')(db, sanitize),
    fiscal            = require('./routes/fiscal')(db),
    synthetic         = require('./routes/synthetic')(db, sanitize),
    journal           = require('./routes/journal')(db, sanitize, util, validate, store, uuid),
    createSale        = require('./routes/createSale')(db, parser, journal, uuid),
    createPurchase    = require('./routes/createPurchase')(db, parser, journal, uuid),
    depotRouter       = require('./routes/depot')(db, sanitize, store),
    tree              = require('./routes/tree')(db, parser),
    drugRouter        = require('./routes/drug')(db),
    api               = require('./routes/data')(db, parser),
    serviceDist       = require('./routes/serviceDist')(db, parser, journal, uuid),
    consumptionLoss   = require('./routes/consumptionLoss')(db, parser, journal, uuid);

// create app
var app = express();

// middleware configuration
app.use(compress());
app.use(logger.request());
app.use(bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
app.use(cookieParser());
app.use(session(cfg.session));
app.use('/css', express.static('client/dest/css', { maxAge : 10000 })); // FIXME Hardcoded routes to static folder, seperate static and authenticate
app.use('/lib', express.static('client/dest/lib', { maxAge : 10000 }));
app.use('/i18n', express.static('client/dest/i18n', { maxAge : 10000 }));
// app.use('/assets', express.static('client/dest/assets', {maxAge:10000}));
app.use(authenticate);
app.use(authorize);
app.use(projects);
app.use(express.static(cfg.static, { maxAge : 10000 }));

app.get('/', function (req, res, next) {
  /* jshint unused : false */
  // This is to preserve the /#/ path in the url
  res.sendfile(cfg.rootFile);
});

app.route('/data/')
  .get(api.get)
  .put(api.put)
  .post(api.post);

app.delete('/data/:table/:column/:value', api.delete);

app.post('/purchase', function (req, res, next) {
  createPurchase.run(req.session.user_id, req.body)
  .then(function (id) {
    res.status(200).send({ purchaseId : id });
  })
  .catch(next)
  .done();
});


app.post('/sale/', function (req, res, next) {

  createSale.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({saleId: ans});
  });
});

app.post('/service_dist/', function (req, res, next) {
  serviceDist.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({dist: ans});
  });
});

app.post('/consumption_loss/', function (req, res, next) {
  consumptionLoss.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({dist: ans});
  });
});

app.get('/services/', function (req, res, next) {
  var sql =
    'SELECT `service`.`id`, `service`.`name` AS `service`, `service`.`project_id`, `service`.`cost_center_id`, `service`.`profit_center_id`, `cost_center`.`text` AS `cost_center`, `profit_center`.`text` AS `profit_center`, `project`.`name` AS `project` '+
    'FROM `service` JOIN `cost_center` JOIN `profit_center` JOIN `project` ON `service`.`cost_center_id`=`cost_center`.`id` AND `service`.`profit_center_id`=`profit_center`.`id` '+
    'AND `service`.`project_id`=`project`.`id`';
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/available_cost_center/', function (req, res, next) {
  var sql =
    'SELECT `cost_center`.`text`, `cost_center`.`id`, `cost_center`.`project_id`, `service`.`name` '+
    'FROM `cost_center` LEFT JOIN `service` ON `service`.`cost_center_id`=`cost_center`.`id`';

  function process(ccs) {
    var costCenters = ccs.filter(function(item) {
      return !item.name;
    });
    return costCenters;
  }
  db.exec(sql)
  .then(function (result) {
    res.send(process(result));
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/available_profit_center/', function (req, res, next) {
  var sql =
    'SELECT `profit_center`.`text`, `profit_center`.`id`, `profit_center`.`project_id`, `service`.`name` '+
    'FROM `profit_center` LEFT JOIN `service` ON `service`.`profit_center_id`=`profit_center`.`id`';

  function process(pcs) {
    var profitCenters = pcs.filter(function(item) {
      return !item.name;
    });
    return profitCenters;
  }
  db.exec(sql)
  .then(function (result) {
    res.send(process(result));
  })
  .catch(function (err) { next(err); })
  .done();

});

app.get('/currentProject', function (req, res, next) {
  var sql =
    'SELECT `project`.`id`, `project`.`name`, `project`.`abbr`, `project`.`enterprise_id`, `enterprise`.`currency_id`, `enterprise`.`location_id`, `enterprise`.`name` as \'enterprise_name\', `enterprise`.`phone`, `enterprise`.`email`, `village`.`name` as \'village\', `sector`.`name` as \'sector\' ' +
    'FROM `project` JOIN `enterprise` ON `project`.`enterprise_id`=`enterprise`.`id` JOIN `village` ON `enterprise`.`location_id`=`village`.`uuid` JOIN `sector` ON `village`.`sector_uuid`=`sector`.`uuid` ' +
    'WHERE `project`.`id`=' + req.session.project_id + ';';
  db.exec(sql)
  .then(function (result) {
    res.send(result[0]);
  })
  .catch(function (err) { next(err); })
  .done();
});

// FIXME: this is terribly insecure.  Please remove
app.get('/user_session', function (req, res) {
  res.send({ id: req.session.user_id });
});

app.get('/pcash_transfer_summers', function (req, res, next) {
  var sql =
    'SELECT `primary_cash`.`reference`, `primary_cash`.`date`, `primary_cash`.`cost`, `primary_cash`.`currency_id` '+
    'FROM `primary_cash` WHERE `primary_cash`.`origin_id`= (SELECT DISTINCT `primary_cash_module`.`id` FROM `primary_cash_module` '+
    'WHERE `primary_cash_module`.`text`=\'transfer\') ORDER BY date, reference DESC LIMIT 20;'; //FIX ME : this request doesn't sort
  db.exec(sql)
  .then(function () {
    var d = []; //for now
    res.send(d);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/trialbalance/initialize', function (req, res, next) {
  trialbalance.run(req.session.user_id, function (err, result) {
    if (err) { return next(err); }
    res.send(200, result);
  });
});

app.get('/trialbalance/submit/:key/', function (req, res, next) {
  trialbalance.postToGeneralLedger(req.session.user_id, req.params.key)
  .then(function () {
    res.send(200);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/editsession/authenticate/:pin', function (req, res, next) {
  var decrypt = req.params.pin >> 5;
  var sql = 'SELECT pin FROM user WHERE user.id = ' + req.session.user_id +
    ' AND pin = \'' + decrypt + '\';';
  db.exec(sql)
  .then(function (rows) {
    res.send({ authenticated : !!rows.length });
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/journal/:table/:id', function (req, res, next) {
  // What are the params here?
  journal.request(req.params.table, req.params.id, req.session.user_id, function (err) {
    if (err) { return next(err); }
    res.send(200);
  });
});

//FIXME receive any number of tables using regex
app.get('/max/:id/:table/:join?', function (req, res) {
  var maxRequest, id = req.params.id,
      table = req.params.table,
      join = req.params.join;

  maxRequest = 'SELECT MAX(' + id + ') FROM ';

  maxRequest += '(SELECT MAX(' + id + ') AS `' + id + '` FROM ' + table;
  if (join) {
    maxRequest += ' UNION ALL SELECT MAX(' + id + ') AS `' + id + '` FROM ' + join + ')a;';
  } else {
    maxRequest += ')a;';
  }

  db.exec(maxRequest)
  .then(function (ans) {
    res.send({max: ans[0]['MAX(' + id + ')']});
  })
  .catch(function (err) {
    res.send(500, {info: 'SQL', detail: err});
    console.error(err);
    return;
  })
  .done();
});

app.get('/ledgers/debitor/:id', function (req, res, next) {
  ledger.debitor(req.params.id)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
});

app.get('/ledgers/debitor_group/:id', function (req, res, next) {
  ledger.debitor_group(req.params.id)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
});

app.get('/ledgers/distributableSale/:id', function (req, res, next) {
  ledger.distributableSale(req.params.id)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
});


app.get('/fiscal/:enterprise/:startDate/:endDate/:description', function (req, res) {
  var enterprise = req.params.enterprise;
  var startDate = new Date(Number(req.params.startDate));
  var endDate = new Date(Number(req.params.endDate));
  var description = req.params.description;

  fiscal.create(enterprise, startDate, endDate, description)
  .then(function (status) {
    res.status(200).send(status);
  })
  .catch(function (err) {
    res.status(500).send(err);
  })
  .done();
});

app.get('/reports/:route/', function(req, res, next) {
  var route = req.params.route;

  //parse the URL for data following the '?' character
  var query = decodeURIComponent(url.parse(req.url).query);

  report(route, query, function(report, err) {
    if (err) { return next(err); }
    res.send(report);
  });
});

app.get('/InExAccounts/:id_enterprise/', function(req, res, next) {
  // var sql = 'SELECT TRUNCATE(account.account_number * 0.1, 0) AS dedrick, account.id, account.account_number, account.account_txt, parent FROM account WHERE account.enterprise_id = ''+req.params.id_enterprise+'''+
  // ' AND TRUNCATE(account.account_number * 0.1, 0)='6' OR TRUNCATE(account.account_number * 0.1, 0)='7'';
  var sql =
    'SELECT account.id, account.account_number, account.account_txt, parent ' +
    'FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ';';
  function process(accounts) {
    var InExAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0 || item.account_number.toString().indexOf('7') === 0;
    });
    return InExAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/availableAccounts/:id_enterprise/', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.cc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/availableAccounts_profit/:id_enterprise/', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.pc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});


app.get('/cost/:id_project/:cc_id', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account '+
    'WHERE account.cc_id = ' + sanitize.escape(req.params.cc_id) + 
    ' AND account.account_type_id <> 3';

  function process(accounts) {
    if(accounts.length === 0) {return {cost : 0};}
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });

    var cost = availablechargeAccounts.reduce(function (x, y) {
      return x + (y.debit - y.credit);

    }, 0);

    return {cost : cost};
  }

  db.exec(sql)
  .then(function (ans) {
    synthetic('ccc', req.params.id_project, {cc_id : req.params.cc_id, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    });
  })
  .catch(next)
  .done();
});


app.get('/profit/:id_project/:service_id', function(req, res, next) {
  function process (values) {
    if (values.length <= 0) { return {profit : 0}; }
    var som = 0;
    values.forEach(function (value) {
      som+= value.credit;
    });
    return {profit:som};
  }

  synthetic('sp', req.params.id_project, {service_id : req.params.service_id}, function (err, data) {
    if (err) { return next(err); }
    res.send(process(data));
  });
});

app.get('/costCenterAccount/:id_enterprise/:cost_center_id', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN cost_center ' +
    'ON account.cc_id = cost_center.id '+
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.cc_id = ' + sanitize.escape(req.params.cost_center_id) + ';';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/profitCenterAccount/:id_enterprise/:profit_center_id', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN profit_center ' +
    'ON account.pc_id = profit_center.id '+
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.pc_id = ' + sanitize.escape(req.params.profit_center_id) + ';';

  function process(accounts) {
    var availableprofitAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availableprofitAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/removeFromCostCenter/:tab', function(req, res, next) {
  var tabs = JSON.parse(req.params.tab);

  tabs = tabs.map(function (item) {
    return item.id;
  });

  var sql =
    'UPDATE `account` SET `account`.`cc_id` = NULL WHERE `account`.`id` IN ('+tabs.join(',')+')';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.get('/removeFromProfitCenter/:tab', function(req, res, next) {
  var tabs = JSON.parse(req.params.tab);
  tabs = tabs.map(function (item) {
    return item.id;
  });

  var sql =
    'UPDATE `account` SET `account`.`pc_id` = NULL WHERE `account`.`id` IN (' + tabs.join(',') + ')';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});


app.get('/auxiliairyCenterAccount/:id_enterprise/:auxiliairy_center_id', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN auxiliairy_center ' +
    'ON account.auxiliairy_center_id = auxiliairy_center.id ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.auxiliairy_center_id = ' + sanitize.escape(req.params.auxiliairy_center_id) + ';';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/tree', function (req, res, next) {
  /* jshint unused : false*/

  tree.load(req.session.user_id)
  .then(function (treeData) {
    res.send(treeData);
  })
  .catch(function (err) {
    res.send(301, err);
  })
  .done();
});

app.get('/location/:villageId?', function (req, res, next) {
  var specifyVillage = req.params.villageId ? ' AND `village`.`uuid`=\'' + req.params.villageId + '\'' : '';

  var sql =
    'SELECT `village`.`uuid` as `uuid`, village.uuid as village_uuid, `village`.`name` as `village`, ' +
      '`sector`.`name` as `sector`, sector.uuid as sector_uuid, `province`.`name` as `province`, province.uuid as province_uuid, ' +
      '`country`.`country_en` as `country`, country.uuid as country_uuid ' +
    'FROM `village`, `sector`, `province`, `country` ' +
    'WHERE village.sector_uuid = sector.uuid AND ' +
      'sector.province_uuid = province.uuid AND ' +
      'province.country_uuid=country.uuid ' + specifyVillage + ';';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.get('/village/', function (req, res, next) {
  /*jshint unused : false*/

  var sql =
    'SELECT `village`.`uuid` AS `uuid`,  `village`.`name` AS `village`, ' +
    '`sector`.`uuid` AS `sector_uuid`, `sector`.`name` as `sector` ' +
    'FROM `village`, `sector` ' +
    'WHERE village.`sector_uuid` = sector.uuid';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.get('/sector/', function (req, res, next) {

  /*jshint unused : false*/
  var sql = 'SELECT `sector`.`uuid` as `uuid`,  `sector`.`name` as `sector`, `province`.`uuid` '+
            'as `province_uuid`, `province`.`name` as `province` FROM `sector`, `province` '+
            'WHERE `sector`.`province_uuid` = `province`.`uuid`';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.get('/province/', function (req, res, next) {
  /*jshint unused : false*/
  var sql =
    'SELECT `province`.`uuid` as `uuid`,  `province`.`name` as `province`, `country`.`uuid` '+
      'AS `country_uuid`, `country`.`country_en` as `country_en`, `country`.`country_fr` as `country_fr` ' +
    'FROM `province`, `country` '+
    'WHERE `province`.`country_uuid` = `country`.`uuid`';
  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

// FIXME : make this code more modular
app.get('/visit/:patientId', function (req, res, next) {
  var patientId = req.params.patientId;
  var sql =
    'INSERT INTO `patient_visit` (`uuid`, `patient_uuid`, `registered_by`) VALUES ' +
    '(' + [sanitize.escape(uuid()), patientId, req.session.user_id].join(', ') + ');';
  db.exec(sql)
  .then(function () {
    res.send();
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/caution/:debitor_uuid/:project_id', function (req, res, next) {
  var sql, debitor_uuid = sanitize.escape(req.params.debitor_uuid),
      project_id = sanitize.escape(req.params.project_id);
  //prochaine enterprise_id sera obtenue par requette via debitor_id

  sql =
    'SELECT `enterprise`.`currency_id` ' +
    'FROM `enterprise` ' +
    'WHERE `enterprise`.`id` = (SELECT `project`.`enterprise_id` FROM `project` WHERE `project`.`id`='+project_id+')';

  db.exec(sql)
  .then(function (ans) {
    var currency_id = ans.pop().currency_id;
    sql =
      'SELECT `t`.`uuid`, `t`.`trans_id`, `t`.`trans_date`, `t`.`debit_equiv` AS `debit`, ' +
        '`t`.`credit_equiv` AS `credit`, `t`.`description`, `t`.`account_id` ' +
        'FROM (' +
          'SELECT `posting_journal`.`uuid`, `posting_journal`.`inv_po_id`, `posting_journal`.`account_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit_equiv`, ' +
            '`posting_journal`.`credit_equiv`, `posting_journal`.`deb_cred_uuid`, ' +
            '`posting_journal`.`trans_id`, `posting_journal`.`description` ' +
          'FROM `posting_journal` WHERE `posting_journal`.`deb_cred_uuid` = ' + debitor_uuid +
        ' UNION ' +
          'SELECT `general_ledger`.`uuid`, `general_ledger`.`inv_po_id`, `general_ledger`.`account_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit_equiv`, ' +
            '`general_ledger`.`credit_equiv`, `general_ledger`.`deb_cred_uuid`, ' +
            '`general_ledger`.`trans_id`, `general_ledger`.`description` ' +
          'FROM `general_ledger` WHERE `general_ledger`.`deb_cred_uuid` = ' + debitor_uuid +
        ') AS `t` JOIN `account` ON `t`.`account_id` = `account`.`id` ' +
        'WHERE `t`.`account_id` IN (' +
          'SELECT `caution_box_account_currency`.`account_id` FROM `caution_box_account_currency` ' +
          'WHERE `caution_box_account_currency`.`currency_id`=' +currency_id +
          ' AND `caution_box_account_currency`.`caution_box_id`= (SELECT distinct `caution_box`.`id` FROM `caution_box` WHERE `caution_box`.`project_id`='+ project_id +'));';
    return db.exec(sql);
  })
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/account_balance/:id', function (req, res, next) {
  // TODO : put this in a module!
  var enterprise_id = req.params.id;

  var sql =
    'SELECT temp.`id`, temp.`account_number`, temp.`account_txt`, account_type.`type`, temp.`parent`, temp.`fixed`, temp.`balance` FROM ' +
    '(' +
      'SELECT account.id, account.account_number, account.account_txt, account.account_type_id, account.parent, account.fixed, period_total.credit - period_total.debit as balance ' +
      'FROM account LEFT JOIN period_total ' +
      'ON account.id=period_total.account_id ' +
      'WHERE account.enterprise_id = ' + sanitize.escape(enterprise_id) +
    ') ' +
    'AS temp JOIN account_type ' +
    'ON temp.account_type_id = account_type.id ' +
    'ORDER BY temp.account_number;';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (err) { next(err); })
  .done();
});


app.get('/synthetic/:goal/:project_id?', function (req, res, next) {
  var query = decodeURIComponent(url.parse(req.url).query);
  synthetic(req.params.goal, req.params.project_id, query, function (err, data) {
    if (err) { return next(err); }
    res.send(data);
  });
});

app.get('/period/:date', function (req, res, next) {
  var date = sanitize.escape(util.toMysqlDate(new Date(Number(req.params.date))));

  var sql =
    'SELECT id, fiscal_year_id FROM period ' +
    'WHERE period_start <= ' + date + ' AND period_stop >= ' + date + ' LIMIT 1';

  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/lot/:inventory_uuid', function (req, res, next) {
  var sql = 'SELECT expiration_date, lot_number, tracking_number, quantity, code, uuid, text FROM stock, inventory WHERE inventory.uuid = stock.inventory_uuid AND stock.inventory_uuid='+sanitize.escape(req.params.inventory_uuid);
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/max_trans/:project_id', function (req, res, next) {
  var project_id = sanitize.escape(req.params.project_id);
  var sql =
    'SELECT abbr, max(increment) AS increment FROM (' +
      'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
      'FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
      'WHERE project_id = ' + project_id + ' ' +
      'UNION ' +
      'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
      'FROM general_ledger JOIN project ON general_ledger.project_id = project.id ' +
      'WHERE project_id = ' + project_id + ')c;';
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/print/journal', function (req, res, next) {
  /*jshint unused : false*/
  res.send('Under Contruction');
});

app.get('/inventory/depot/:depot/*', function (req, res, next) {
  depotRouter(req.url, req.params.depot)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/inventory/drug/:code', function (req, res, next) {
  drugRouter(req.params.code)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/stockIn/:depot_uuid/:df/:dt', function (req, res, next) {
  var sql;
  var condition =
    'WHERE stock.expiration_date >= ' + sanitize.escape(req.params.df) + ' ' +
    'AND stock.expiration_date <= ' + sanitize.escape(req.params.dt);
  condition += (req.params.depot_uuid === '*') ? '' : ' AND consumption.depot_uuid = ' + sanitize.escape(req.params.depot_uuid) + ' ';

  if (req.params.depot_uuid === '*') {
    sql =
      'SELECT stock.inventory_uuid, stock.tracking_number, stock.lot_number, SUM(consumption.quantity) AS consumed, ' +
        'stock.expiration_date, stock.quantity as initial ' +
      'FROM stock LEFT JOIN consumption ON ' +
        'stock.tracking_number=consumption.tracking_number '+condition+
        'GROUP BY stock.tracking_number;';

  } else {
    sql =
      'SELECT stock.inventory_uuid, stock.tracking_number, '+
      'stock.lot_number, stock.quantity, SUM(consumption.quantity) AS consumed,'+
      'movement.quantity, ';
  }

  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});


app.get('/expiring/:depot_uuid/:df/:dt', function (req, res, next) {
  //TODO : put it in a separate file

  db.exec(req.params.depot_uuid === '*' ? genSql() : speSql())
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();

  function genSql () {
    return 'SELECT stock.inventory_uuid, stock.tracking_number, ' +
          'stock.lot_number, stock.quantity as initial, stock.expiration_date, inventory.text '+
          'FROM stock JOIN inventory ON stock.inventory_uuid = inventory.uuid '+
          'WHERE DATE(stock.expiration_date) >=DATE('+sanitize.escape(req.params.df)+')'+
          ' AND DATE(stock.expiration_date) <=DATE('+sanitize.escape(req.params.dt)+')';
  }

  function speSql() {
    return 'SELECT stock.inventory_uuid, stock.tracking_number, ' +
          'stock.lot_number, stock.expiration_date, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, (movement.quantity*-1))) as current, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, 0)) AS initial, inventory.text FROM stock JOIN inventory JOIN movement ON stock.inventory_uuid = inventory.uuid AND '+
          'stock.tracking_number = movement.tracking_number WHERE (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          'OR movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+') AND stock.expiration_date>='+sanitize.escape(req.params.df)+
          ' AND stock.expiration_date<='+sanitize.escape(req.params.dt)+' GROUP BY movement.tracking_number';
  }
});

app.get('/expiring_complete/:tracking_number/:depot_uuid', function (req, res, next) {
  //TODO : put it in a separate file
  db.exec(req.params.depot_uuid === '*' ? genSql() : speSql())
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();

  function genSql () {
    return 'SELECT SUM(consumption.quantity) AS consumed FROM stock LEFT JOIN consumption '+
           'ON stock.tracking_number = consumption.tracking_number WHERE stock.tracking_number='+sanitize.escape(req.params.tracking_number);
  }

  function speSql () {
    return 'SELECT SUM(consumption.quantity) AS consumed FROM stock LEFT JOIN consumption '+
         'ON stock.tracking_number = consumption.tracking_number WHERE stock.tracking_number='+sanitize.escape(req.params.tracking_number)+
         ' AND consumption.depot_uuid='+sanitize.escape(req.params.depot_uuid);
  }
});

app.get('/serv_dist_stock/:depot_uuid', function (req, res, next) {
  //TODO : put it in a separate file
 var sql= 'SELECT stock.inventory_uuid, stock.tracking_number, ' +
          'stock.lot_number, stock.expiration_date, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, 0)) AS entered, SUM(if (movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, 0)) AS moved,  inventory.text, inventory.code, inventory.purchase_price  FROM stock JOIN inventory JOIN movement ON stock.inventory_uuid = inventory.uuid AND '+
          'stock.tracking_number = movement.tracking_number WHERE (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          'OR movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+') GROUP BY stock.tracking_number';
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
      next(err);
  })
  .done();
});

app.get('/inv_in_depot/:depot_uuid', function (req, res, next){
  var sql = 'SELECT '+
            'distinct inventory.text, '+
            'inventory.uuid, '+
            'inventory.code '+
            'FROM stock JOIN inventory JOIN ON stock.inventory_uuid = inventory.uuid '+
            'WHERE stock.depot_uuid='+sanitize.escape(req.params.depot_uuid);

  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/errorcodes', function (req, res, next) {
  /* jshint unused : false */
  res.send(errorCodes);
});

app.use(logger.error());
app.use(liberror.middleware);

https.createServer(options, app)
.listen(cfg.port, function () {
  console.log('Secure application running on localhost:' + cfg.port);
});

// temporary error handling for development!
process.on('uncaughtException', function (err) {
  console.log('[uncaughtException]', err);
  process.exit();
});

// temporary debugging to see why the process terminates.
process.on('exit', function () {
  console.log('Process shutting down...');
});
