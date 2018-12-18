'use strict';
// github skylarstein/bme280-sensor: https://github.com/skylarstein/bme280-sensor

const BME280 = require('bme280-sensor');

var DEFAULT_OPTIONS = {
    i2cBusNo: 1,
    i2cAddress: BME280.BME280_DEFAULT_I2C_ADDRESS()
}

const bme280 = new BME280(DEFAULT_OPTIONS);

var init = function (cb) {
    bme280.init()
        .then(cb)
        .catch((err) => {
            console.error(err);
        });
}

var read = function (cb) {
    bme280.readSensorData()
        .then((data) => {
            cb(null, data);
        })
        .catch(cb);
}

module.exports.init = init;
module.exports.read = read;

// read data from sensor 
// data = {
//   "temperature_C": 32.09,
//   "humidity": 34.851083883116694,
//   "pressure_hPa": 1010.918480644477
// }