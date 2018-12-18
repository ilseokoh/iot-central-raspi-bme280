'use strict'; 

var Message = require('azure-iot-device').Message; 
var Sensor = require('./bme280');
var config = require('./config.json');

var isSensorInit = false;

var temperatureUnit = 'C';
var humidityUnit = '%';
var pressureUnit = 'hPa'

var temperatureSchema = 'firealarm-temperature;v1';
var humiditySchema = 'firealarm-humidity;v1';
var pressureSchema = 'firealarm-pressure;v1';

var reportedProperties = {
    "Protocol": "MQTT",
    "SupportedMethods": "Reboot,FirmwareUpdate,AlertLEDOn",
    "Telemetry": {
        "TemperatureSchema": {
            "Interval": "00:00:05",
            "MessageTemplate": "{\"temperature\":${temperature},\"temperature_unit\":\"${temperature_unit}\"}",
            "MessageSchema": {
                "Name": temperatureSchema,
                "Format": "JSON",
                "Fields": {
                    "temperature": "Double",
                    "temperature_unit": "Text"
                }
            }
        },
        "HumiditySchema": {
            "Interval": "00:00:05",
            "MessageTemplate": "{\"humidity\":${humidity},\"humidity_unit\":\"${humidity_unit}\"}",
            "MessageSchema": {
                "Name": 'firealarm-humidity;v1',
                "Format": "JSON",
                "Fields": {
                    "humidity": "Double",
                    "humidity_unit": "Text"
                }
            }
        },
        "PressureSchema": {
            "Interval": "00:00:05",
            "MessageTemplate": "{\"pressure\":${pressure},\"pressure_unit\":\"${pressure_unit}\"}",
            "MessageSchema": {
                "Name": pressureSchema,
                "Format": "JSON",
                "Fields": {
                    "pressure": "Double",
                    "pressure_unit": "Text"
                }
            }
        },
        "EmergencySchema": {
            "Interval": "00:00:01",
            "MessageTemplate": "{\"emergencyButtonOn\":${emergencyButtonOn}}",
            "MessageSchema": {
                "Name": humiditySchema,
                "Format": "JSON",
                "Fields": {
                    "emergencyButtonOn": "Integer"
                }
            }
        },
    },
    "Type": config.deviceType,
    "Firmware": config.deviceFirmware,
    "FirmwareUpdateStatus": config.deviceFirmwareUpdateStatus,
    "Location": config.deviceLocation,
    "Latitude": config.deviceLatitude,
    "Longitude": config.deviceLongitude,
    "Online": config.deviceOnline,
    "AlertLED": config.alertLEDOn
}

Sensor.init(() => {
    console.log("BME280 sensor initialized successfully.");
    isSensorInit = true;
});

function sendTelemetry(client, data, schema) {
    var d = new Date();
    var payload = JSON.stringify(data);
    var message = new Message(payload);
    message.properties.add('$$CreationTimeUtc', d.toISOString());
    message.properties.add('$$MessageSchema', schema);
    message.properties.add('$$ContentType', 'JSON');

    //console.log('Sending device message data:\n' + payload);
    client.sendEvent(message, printErrorFor('send event'));
}

var sendSensorData = function(client) { 
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

    var temperatureData = {
        'temperature': sensorData.temperature_C,
        'temperature_unit': temperatureUnit
    };
    sendTelemetry(client, temperatureData, temperatureSchema);

    var humidityData = {
        'humidity': sensorData.humidity,
        'humidity_unit': humidityUnit
    };
    sendTelemetry(client, humidityData, humiditySchema);

    var pressureData = {
        'pressure': sensorData.pressure_hPa,
        'pressure_unit': pressureUnit
      };
      sendTelemetry(client, pressureData, pressureSchema);
}

var sendDeviceProperties = function(twin) { 
    twin.properties.reported.update(reportedProperties, (err) => {
        console.log(`Sent device properties; ` +
        (err ? `error: ${err.toString()}` : `status: success`));
    });
}

module.exports.sendSensorData = sendSensorData;
module.exports.sendDeviceProperties = sendDeviceProperties;