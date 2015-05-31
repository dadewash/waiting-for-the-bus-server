'use strict';
/*jshint camelcase: false */
var mongoose = require('mongoose');

function normalizeTimeFormat(time){
  if (time.length === '00:00:00'.length){
    return time;
  } else {
    return '0' + time;
  }
}

var Agency = mongoose.model('Agency', new mongoose.Schema({
    agency_key        :  { type: String, index: true }
  , agency_id         :  { type: String }
  , agency_name       :  { type: String }
  , agency_url        :  { type: String }
  , agency_timezone   :  { type: String }
  , agency_lang       :  { type: String }
  , agency_phone      :  { type: String }
  , agency_fare_url   :  { type: String }
  , agency_bounds     :  {
      sw : {type: Array, index: '2d'}
    , ne : {type: Array, index: '2d'}
  }
  , agency_center     :  { type: Array, index: '2d' }
  , date_last_updated :  { type: Number }
}));
var Calendar = mongoose.model('Calendar', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , service_id        :  { type: String }
      , monday            :  { type: String }
      , tuesday           :  { type: String }
      , wednesday         :  { type: String }
      , thursday          :  { type: String }
      , friday            :  { type: String }
      , saturday          :  { type: String }
      , sunday            :  { type: String }
      , start_date        :  { type: String }
      , end_date          :  { type: String }
    }));
var CalendarDate = mongoose.model('CalendarDate', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , service_id        :  { type: String }
      , date              :  { type: String }
      , exception_type    :  { type: String }
    }));
var FareAttribute = mongoose.model('FareAttribute', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , fare_id           :  { type: String }
      , price             :  { type: String }
      , currency_type     :  { type: String }
      , payment_method    :  { type: String }
      , transfers         :  { type: String }
      , transfer_duration :  { type: String }
    }));
var FareRule = mongoose.model('FareRule', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , fare_id           :  { type: String }
      , route_id          :  { type: String }
      , origin_id         :  { type: String }
      , destination_id    :  { type: String }
      , contains_id       :  { type: String }
    }));
var FeedInfo = mongoose.model('FeedInfo', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , feed_publisher_name :  { type: String }
      , feed_publisher_url :  { type: String }
      , feed_lang         :  { type: String }
      , feed_start_date   :  { type: String }
      , feed_end_date     :  { type: String }
      , feed_version      :  { type: String }
    }));
var Frequencies = mongoose.model('Frequencies', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , trip_id           :  { type: String }
      , start_time        :  { type: String }
      , end_time          :  { type: String }
      , headway_secs      :  { type: String }
      , exact_times       :  { type: String }
    }));
var Route = mongoose.model('Route', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , route_id          :  { type: String }
      , agency_id         :  { type: String }
      , route_short_name  :  { type: String }
      , route_long_name   :  { type: String }
      , route_desc        :  { type: String }
      , route_type        :  { type: String }
      , route_url         :  { type: String }
      , route_color       :  { type: String }
      , route_text_color  :  { type: String }
    }));
var Shape = mongoose.model('Shape', new mongoose.Schema({
        agency_key           :  { type: String, index: true }
      , shape_id             :  { type: String, index: true }
      , shape_pt_lat         :  { type: Number }
      , shape_pt_lon         :  { type: Number }
      , loc                  :  { type: Array, index: '2d' }
      , shape_pt_sequence    :  { type: Number }
      , shape_dist_traveled  :  { type: Number }
    }));
var Stop = mongoose.model('Stop', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , stop_id           :  { type: String, index: true }
      , stop_code         :  { type: String }
      , stop_name         :  { type: String }
      , stop_desc         :  { type: String }
      , stop_lat          :  { type: Number }
      , stop_lon          :  { type: Number }
      , loc               :  { type: Array, index: '2d' }
      , zone_id           :  { type: String }
      , stop_url          :  { type: String }
      , location_type     :  { type: String }
      , parent_station    :  { type: String }
      , stop_timezone     :  { type: String }
    }));
var utils = require('../lib/utils')
  , StopTime = mongoose.model('StopTime', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , trip_id           :  { type: String, index: true }
      , arrival_time      :  { type: String, set: normalizeTimeFormat }
      , departure_time    :  { type: String, index: true, set: normalizeTimeFormat }
      , stop_id           :  { type: String, index: true }
      , stop_sequence     :  { type: Number, index: true }
      , stop_headsign     :  { type: String }
      , pickup_type       :  { type: String }
      , drop_off_type     :  { type: String }
      , shape_dist_traveled :  { type: String }
    }));
var Transfer = mongoose.model('Transfer', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , from_stop_id      :  { type: String }
      , to_stop_id        :  { type: String }
      , transfer_type     :  { type: String }
      , min_transfer_time :  { type: String }
    }));
var Trip = mongoose.model('Trip', new mongoose.Schema({
        agency_key        :  { type: String, index: true }
      , route_id          :  { type: String, index: true }
      , service_id        :  { type: String, index: true }
      , trip_id           :  { type: String }
      , trip_headsign     :  { type: String }
      , trip_short_name   :  { type: String }
      , direction_id      :  { type: Number, index: true, min:0, max:1 }
      , block_id          :  { type: String }
      , shape_id          :  { type: String }
    }));
