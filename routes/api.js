'use strict';
/*jshint camelcase: false */
var router = require('express').Router();
var mongoose = require('mongoose');
var _ = require('underscore');
var utils = require('../lib/utils');
var async = require('async'),
    memoize = require('memoizee'),
    moment = require('moment'),
    apicache = require('apicache');

apicache.options({debug:true});

var cache = apicache.middleware;


require('../models/models'); // register models

mongoose.set('debug', true);

var db = mongoose.connect(process.env.MONGOHQ_URL);

var Agency = db.model('Agency'),
Calendar = db.model('Calendar'),
Route = db.model('Route'),
Stop = db.model('Stop'),
StopTime = db.model('StopTime'),
Trip = db.model('Trip'),
Calendar = db.model('Calendar');

function convertToRadians(distance, unit){
  if (unit === 'miles'){
    return Math.round(distance/69*100000)/100000;
  }else if (unit === 'kilometers') {
    return distance / 111.12;
  }else{
    throw new Error('`' + unit + ' is not a valid unit. Choose between `miles` or `kilometers`.');
  }
}

function getServices(agency_key, opt, cb){
  var date = opt.date || new Date();
  var dateFormatted = utils.formatDay(date);

  var service_ids = [];

      //build query
  var query = {
    agency_key: agency_key,
  };
  query[utils.getDayName(date).toLowerCase()] = 1; // eg: monday: 1

  Calendar
    .find(query)
    .where('start_date').lte(dateFormatted)
    .where('end_date').gte(dateFormatted)
    .exec(function(err, services){
      if (err) return cb(err);

      return cb(null, services.map(function(service){
        return service.service_id;
      }));
    });
}


/**
 * @api {get} /agencies List of agencies.
 * @apiName List
 * @apiGroup Agencies
 *
 *
 * @apiSuccess {Object[]} agencies       List of agencies.
 * @apiSuccess {String}   agencies.agency_key   Agency key.
 * @apiSuccess {String}   agencies.agency_name
 * @apiSuccess {String}   agencies.agency_url
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
{
    "agencies": [
        {
            "agency_bounds": {
                "ne": [
                    11.1847,
                    46.143164
                ],
                "sw": [
                    10.951531,
                    45.836852
                ]
            },
            "agency_center": [
                11.0681155,
                45.990008
            ],
            "agency_id": "12",
            "agency_key": "trentino-trasporti-esercizio-spa",
            "agency_lang": "it",
            "agency_name": "Trentino trasporti esercizio S.p.A.",
            "agency_phone": "+39 0461 821000",
            "agency_timezone": "Europe/Rome",
            "agency_url": "http://www.ttesercizio.it",
            "date_last_updated": 1429151683802
        }
    ]
}
 *
 */
router.get('/agencies', function(req, res, next) {
  Agency.find({}, function(e, data) {
    if(e) {
      return next(e);
    }
    if (! data){
      return next(new Error("No agencies in database"));
    }
    res.send({agencies: data});
  });
});


/**
 * @api {get} /agenciesNearby/:lat/:lon/:maxDistance*? Find agencies nearby.
 * @apiName ListNearby
 * @apiGroup Agencies
 *
 * @apiParam {Float} lat     Latitude.
 * @apiParam {Float} lon     Longitude.
 *
 * @apiParam {Float} [maxDistance=100]     Maximum distance.
 * @apiParam {String=kilometers,miles}  [unit=kilometers]  Measure unit.
 *
 *
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
{
    "agencies": [
        {
            "agency_bounds": {
                "ne": [
                    11.1847,
                    46.143164
                ],
                "sw": [
                    10.951531,
                    45.836852
                ]
            },
            "agency_center": [
                11.0681155,
                45.990008
            ],
            "agency_id": "12",
            "agency_key": "trentino-trasporti-esercizio-spa",
            "agency_lang": "it",
            "agency_name": "Trentino trasporti esercizio S.p.A.",
            "agency_phone": "+39 0461 821000",
            "agency_timezone": "Europe/Rome",
            "agency_url": "http://www.ttesercizio.it",
            "date_last_updated": 1429151683802
        }
    ]
}
 *
 */
router.get('/agenciesNearby/:lat/:lon/:maxDistance*?', function(req, res, next) {
  var lat = parseFloat(req.params.lat),
      lon = parseFloat(req.params.lon),
      maxDistance = req.params.maxDistance,
      unit = req.query.unit || 'kilometers';

  if (! maxDistance){
    maxDistance = 100; // km
    unit = 'kilometers';
  }

  maxDistance = parseFloat(maxDistance);
  var radius;
  try{
    radius = convertToRadians(maxDistance, unit);
  }catch(e){
    console.log(e);
    return next(e);
  }

  Agency
    .where('agency_center')
    .near(lon, lat).maxDistance(radius)
    .exec(function (e, data){
      if(e) {
        return next(e);
      }
      if (! data){
        next(new Error('No agencies within radius of ' + radius + ' miles'));
      }
      res.send({agencies: data});
    });
});

/**
 * @api {get} /routes/:agency List all the routes for a given agency.
 * @apiName List
 * @apiGroup Routes
 *
 * @apiParam {String} agency
 *
 *
 *
 */
// function getRoutes(agency_key, cb){
//   Route
//     .find({agency_key: agency_key})
//     .exec(function(err, routeData) {
//       cb(err, routeData);
//     });
// }
// var getRoutesCached = memoize(getRoutes, {
//   max: 100,
//   maxAge: 10000,
//   async: true,
//   preFetch: 0.5
// });

router.get('/routes/:agency', function(req, res, next){
  var agency_key = req.params.agency;

  // getRoutesCached(agency_key, function(err, data){
  //   if (err) return next(err);

  //   res.send({routes: data});
  // });

  Route
    .find({agency_key: agency_key})
    .exec(function(err, routeData) {
      if (err) return next(err);

      res.send({routes: routeData});
    });
});

/**
 * @api {get} /stopsNearby/:lat/:lon/:maxDistance*? Find stops nearby.
 * @apiName ListNearby
 * @apiGroup Stops
 *
 * @apiParam {Float} lat     Latitude.
 * @apiParam {Float} lon     Longitude.
 *
 * @apiParam {Float} [maxDistance=100]     Maximum distance.
 * @apiParam {String=kilometers,miles}  [unit=kilometers]  Measure unit.
 *
 *
 *
 *
 */
router.get('/stopsNearby/:lat/:lon/:maxDistance*?', function(req, res, next) {
  var lat = parseFloat(req.params.lat),
      lon = parseFloat(req.params.lon),
      maxDistance = req.params.maxDistance,
      unit = req.query.unit || 'kilometers';

  if (! maxDistance){
    maxDistance = 10; // km
    unit = 'kilometers';
  }

  maxDistance = parseFloat(maxDistance);
  var radius;
  try{
    radius = convertToRadians(maxDistance, unit);
  }catch(e){
    console.log(e);
    return next(e);
  }

  Stop
    .where('loc')
    .near(lon, lat).maxDistance(radius)
    .exec(function (e, data){
      if(e) {
        return next(e);
      }
      if (! data){
        next(new Error('No stops within radius of ' + radius + ' miles'));
      }
      res.send({stops: data});
    });
});

/**
 * @api {get} /stops/:agency/route List all the stops of a given route.
 * @apiName List
 * @apiGroup Stops
 *
 * @apiParam {String} agency
 * @apiParam {String} route_id
 *
 * @apiParam {String} [date=today]
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
{
    "stops": [
        {
            "agency_key": "trentino-trasporti-esercizio-spa",
            "direction_id": 0,
            "loc": [
                11.046924,
                46.078317
            ],
            "stop_code": "28105Z",
            "stop_desc": "",
            "stop_id": "1",
            "stop_lat": 46.078317,
            "stop_lon": 11.046924,
            "stop_name": "Baselga Del Bondone",
            "zone_id": "10110"
        },
        {
            "agency_key": "trentino-trasporti-esercizio-spa",
            "direction_id": 0,
            "loc": [
                11.065018,
                46.08863
            ],
            "stop_code": "28205Z",
            "stop_desc": "",
            "stop_id": "10",
            "stop_lat": 46.08863,
            "stop_lon": 11.065018,
            "stop_name": "Cadine Strada Gardesana",
            "zone_id": "10110"
        },
    ...
}

 */
router.get('/stops/:agency/:route_id', cache('1 day'), function(req, res, next){
  var agency_key = req.params.agency,
      route_id = req.params.route_id,
      date = req.query.date;

  if (date){
    date = new Date(date);
    if (isNaN(date.getDate())){
      return cb(new Error('Invalid date.'));
    }
  }

  async.waterfall([
    function(cb) {
      if (date) {
        getServices(agency_key, {date: date}, function(err, service_ids){
          cb(err, service_ids);
        });
      } else {
        cb(null, []);
      }
    },
    function(service_ids, cb) {
      var query = {agency_key: agency_key, route_id: route_id};
      if (service_ids.length !== 0) {
        query.service_id = {$in: service_ids};
      }
      Trip
        .find(query)
        .select('trip_id direction_id')
        .exec(function(err, trips) {
          cb(err, trips);
        });
    },
    function(trips, cb){
      StopTime
        .find({agency_key: agency_key})
        .where('trip_id').in(trips.map(function(e){
          return e.trip_id;
        }))
        .sort('stop_sequence')
        .exec(function(err, stopTimes){
          if (err) return cb(err);

          stopTimes = stopTimes.map(function (stopTime) {
            stopTime = stopTime.toObject();
            var trip = _.findWhere(trips, {trip_id: stopTime.trip_id});
            stopTime.direction_id = trip.direction_id;
            return stopTime;
          });

          cb(null, stopTimes);
        });
    },
    function(stopTimes, cb) {
      Stop
        .find({agency_key: agency_key})
        .where('stop_id').in(stopTimes.map(function(e){
          return e.stop_id;
        }))
        .exec(function(err, stops){
          if (err) return cb(err);
          stops = stops.map(function (stop){
            stop = stop.toObject();
            var stopTime = _.findWhere(stopTimes, {stop_id: stop.stop_id});
            stop.direction_id = stopTime.direction_id;
            stop.stop_sequence = stopTime.stop_sequence;
            return stop;
          });

          stops.sort(function(a, b) {
            if (a.stop_sequence === b.stop_sequence) return 0;
            if (a.stop_sequence < b.stop_sequence) return -1;
            if (a.stop_sequence > b.stop_sequence) return 1;
          });
          cb(err, stops);
        });
    }
  ], function(err, stops){
    if (err) return next(err);

    res.send({stops: stops});
  });
});

/**
 * @api {get} /times/:agency/:stop_id  Get times for a given stop.
 * @apiName Get
 * @apiGroup StopTimes
 *
 * @apiParam {String} agency_key
 * @apiParam {String} stop_id
 * @apiParam {String} [route_id] Specify the route to limit the results to that one.
 * @apiParam {String} [date=today] Specify the date
 * @apiParam {String} [from_time=now]
 * @apiParam {String} [to_time]
 * @apiParam {String} [time_offset]   Use this or [to_time]
 *
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
{
    stopTimes: [
        {
            "agency_key": "trentino-trasporti-esercizio-spa",
            "arrival_time": "07:04:00",
            "departure_time": "07:04:00",
            "stop_id": "414",
            "stop_sequence": 21,
            "trip": {
                "_id": "553477d011ede0030018f00b",
                "agency_key": "trentino-trasporti-esercizio-spa",
                "direction_id": 0,
                "route": {
                    "_id": "553477c211ede0030017baff",
                    "agency_id": "12",
                    "agency_key": "trentino-trasporti-esercizio-spa",
                    "route_color": "007BC3",
                    "route_id": "539",
                    "route_long_name": "Gardolo Roncafort Stazione V.Deg. Mad.Bianca",
                    "route_short_name": "4",
                    "route_text_color": "FFFFFF",
                    "route_type": "3"
                },
                "service_id": "0000000022015020220150609",
                "trip_headsign": "Bettini \"Madonna Bianca\"",
                "trip_id": "0002621942015020220150609"
            }
        }, ...
    ]
}
 *
 *
 */
router.get('/times/:agency/:stop_id', cache('1 day'), function(req, res, next) {
  var agency_key = req.params.agency,
      stop_id = req.params.stop_id,
      route_id = req.query.route_id,
      date = req.query.date,
      from_time = req.query.from_time,
      to_time = req.query.to_time,
      time_offset = req.query.time_offset;

  if (date){
    date = new Date(date);
    if (isNaN(date.getDate())){
      return next(new Error('Invalid date.'));
    }
  }else{
    date = new Date();
  }

  if (!to_time && time_offset){
    var from_time_s = utils.timeToSeconds(from_time);
    var time_offset_s = utils.timeToSeconds(time_offset);
    to_time = utils.secondsToTime(from_time_s + time_offset_s);
  }

  var query = {
    agency_key: agency_key,
    stop_id: stop_id,
  };

  if (from_time || to_time){
    query.departure_time = {};
    if (from_time){
      query.departure_time.$gte = from_time;
    }
    if (to_time){
      query.departure_time.$lte = to_time;
    }
  }

  async.waterfall([
    function(cb) {
      getServices(agency_key, {date: date}, function(err, service_ids){
        cb(err, service_ids);
      });
    },
    function(service_ids, cb) {
      StopTime
        .find(query)
        .sort('departure_time')
        .exec(function(err, data) {
        if (err) return cb(err);

        cb(err, data.map(function(e){
          return e.toObject();
        }), service_ids);
      });
    },
    function (stopTimes, service_ids, cb){
      Trip
        .find({agency_key: agency_key})
        .where('trip_id').in(
          stopTimes.map(function(e){
            return e.trip_id;
          }))
        .where('service_id').in(service_ids)
        .exec(function(err, tripData){
          if (err) return cb(err);

          var stopTimesWithTrips = stopTimes.map(function(stopTime){
            var trip = _.findWhere(tripData, {trip_id: stopTime.trip_id});
            if (! trip){
              return;
            }
            stopTime.trip = trip.toObject();
            stopTime.trip_id = undefined;
            return stopTime;
          });
          stopTimesWithTrips = _.compact(stopTimesWithTrips);
          cb(null, stopTimesWithTrips);
        });
    },
    function (stopTimesWithTrips, cb){
      query = {
          agency_key: agency_key,
      };
      if (route_id !== undefined) {
        query.route_id = route_id;
      } else {
        query.route_id = {
          $in: stopTimesWithTrips.map(function(stopTime){
            return stopTime.trip.route_id;
          })
        };
      }
      Route
        .find(query)
        .exec(function(err, routeData){
          if (err) return cb(err);

          stopTimesWithTrips.forEach(function(stopTime){
            var route = _.findWhere(routeData, {route_id: stopTime.trip.route_id}).toObject();
            stopTime.trip.route = route;
            stopTime.trip.route_id = undefined;
          });
          cb(null, stopTimesWithTrips);
        });
    }
  ], function(err, stopTimesWithTripsAndRoutes){
    if (err) return next(err);

    res.send({stopTimes: stopTimesWithTripsAndRoutes});
  });
});


/**
 * @api {get} /stopsByTrip/:agency/:trip_id List all the stops for a given trip.
 * @apiName StopsByTrip
 * @apiGroup Stops
 *
 * @apiParam {String} agency
 * @apiParam {String} trip_id
 * @apiSuccessExample Success-Response:
 *
 *
 {
    "stops": [
        {
            "_id": "553d2b30d58eb703002eb366",
            "agency_key": "trentino-trasporti-esercizio-spa",
            "arrival_time": "20:56:00",
            "departure_time": "20:56:00",
            "stop": [
                {
                    "_id": "553d2b32d58eb703002ee153",
                    "agency_key": "trentino-trasporti-esercizio-spa",
                    "loc": [
                        11.132908,
                        46.0425
                    ],
                    "stop_code": "21115C",
                    "stop_desc": "",
                    "stop_id": "92",
                    "stop_lat": 46.0425,
                    "stop_lon": 11.132908,
                    "stop_name": "Bettini \"Madonna Bianca\"",
                    "zone_id": "10110"
                }
            ],
            "stop_id": "92",
            "stop_sequence": 1,
            "trip_id": "0002622552015020220150609"
        },
        ...
    ]
  }
 *
 */
router.get('/stopsByTrip/:agency/:trip_id', function(req, res, next){
  var agency_key = req.params.agency,
      trip_id = req.params.trip_id;

  StopTime.find({
      agency_key: agency_key,
      trip_id: trip_id
    })
    .sort('stop_sequence')
    .exec(function (err, stopTimesData){
      if (err) return next(err);

      async.map(stopTimesData,
        function(stopTime, cb){
          stopTime = stopTime.toObject();
          Stop
            .find({
              agency_key: agency_key,
              stop_id: stopTime.stop_id
            })
            .exec(function (err, stopData){
              if (err) return cb(err);
              stopTime.stop = stopData;
              cb(null, stopTime);
            });
        },
        function (err, result){
          if (err) return next(err);
          res.send({stops: result});
        }
      );
    });
});


module.exports = router;
