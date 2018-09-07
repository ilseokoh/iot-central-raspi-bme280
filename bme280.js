'use strict';

// github skylarstein/bme280-sensor: https://github.com/skylarstein/bme280-sensor

const BME280 = require('bme280-sensor');
var config = require('./config.json');

var BME280Sensor = { 
    // init sensor
    init: (options, cb) => { 
        this.bme280 = new BME280(options);
        this.bme280.init()
            .then(cb)
            .catch((err) => {
                console.error(err); 
            });
    }, 
    read: (cb) => { 
        this.bme280.readSensorData()
            .then((data) => { 
                cb(null, data);
            })
            .catch(cb);
    }
}

    // read data from sensor 
    // data = {
    //   "temperature_C": 32.09,
    //   "humidity": 34.851083883116694,
    //   "pressure_hPa": 1010.918480644477
    // }

module.exports = BME280Sensor;