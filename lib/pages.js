var _ = require('lodash'),
    express = require('express'),
    Waterline = require('waterline');
var gc = function gc(conf, path, fallback) {
  var parts = path.split('.'),
      temp = conf || {};
  parts.forEach(function(p) {
    temp = temp ? temp[p] : undefined;
  });
  return typeof temp !== 'undefined' ? temp : fallback;
};

var pages = function pages(conf, cb) {
  if (_.isFunction(conf)) {
    cb = conf;
  }

  var orm = new Waterline();
  var ormConfig = {
    adapters: {
      'default': gc(conf, 'db.adapter', require('sails-postgresql')),
    },
    connections: {
      blocks: {
        adapter: 'default',
        host: gc(conf, 'db.host', 'localhost'),
        database: gc(conf, 'db.database', 'blocks'),
        user: gc(conf, 'db.user', 'blocks'),
        password: gc(conf, 'db.password', 'blocks')
      }
    },
    defaults: {
      migrate: 'alter'
    }
  };
  var Page = Waterline.Collection.extend({
    identity: 'page',
    tableName: gc(conf, 'db.page.tableName', 'blocksPage'),
    connection: 'blocks',

    attributes: {
      path: {
        type: 'string',
        required: true
      },
      title: {
        type: 'string',
        required: true
      },
      body: {
        type: 'text',
        required: true
      },
      createdAt: {
        type: 'datetime',
        required: true
      },
      updatedAt: {
        type: 'datetime',
        required: true
      },
      isPublished: {
        type: 'boolean'
      }
    },
    beforeCreate: function(values, cb) {
      values.createdAt = new Date();
      cb();
    },
    beforeUpdate: function(values, cb) {
      values.updatedAt = new Date();
      cb();
    }
  });
  orm.loadCollection(Page);


  var app = express();
  app.get('*', function(req, res, next) {
    app.models.page.findOne({path: req.path}).exec(function(err, model) {
      if (err) return next(err);
      if (!model) return res.send(404);
      console.log(model.toJSON());
      res.send('Ding dong');
    });
  });

  orm.initialize(ormConfig, function(err, models) {
    if (err) cb(err);

    app.models = models.collections;
    app.connections = models.connections;
    cb(null, app);
  });
};

module.exports = pages;
