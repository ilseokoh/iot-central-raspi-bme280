'use strict'; 

var Message = require('azure-iot-device').Message; 
var Sensor = require('./bme280');

var isSensorInit = false;

function MessageProcessor(config) { 
    const options = {
        i2cBusNo: config.i2cBusNo || 1,
        i2cAddress: config.i2cAddress || BME280.BME280_DEFAULT_I2C_ADDRESS()
    }
    Sensor.init(options, () => {
        console.log("BME280 sensor initialized successfully.");
        this.isSensorInit = true;
    });
}

function sendTelemetry() { 
    var sensorData = {}; 
    if (!isSensorInit) {
        console.log("Sensor must initialize before it's used.");
        return;
    }

    // get Data
    Sensor.read((err, data) => { 
        if (err) { 
            console.log("Error occured when read sensor data.");
            console.log(err);
        }
        sensorData = data;
    });

    var data = JSON.stringify({ 
        temperature: sensorData.temperature_C,
        humidity: sensorData.humidity, 
        pressure: sensorData.pressure_hPa, 
        fanmode: (sensorData.temperature_C > 25)  ? 1 : 0, 
        overheat: (sensorData.temperature_C > config.temperatureAlert) ? "ER123" : undefined
    });
}