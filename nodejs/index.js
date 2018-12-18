var Protocol = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').Client;
var ConnectionString = require('azure-iot-device').ConnectionString;
var Message = require('azure-iot-device').Message;
var async = require('async');
var BME280 = require('bme280-sensor');
var wpi = require('node-wiring-pi');

var connectionString = 'HostName=s1iotremotemonitoringc9f9c.azure-devices.net;DeviceId=firealam-02.Real;SharedAccessKey=bxCcsNGFZeL86S4CGi87mmf/meBwND0365G1w4cRiSs=';

var temperature = 25;
var temperatureUnit = 'C';
var humidity = 50;
var humidityUnit = '%';

var temperatureSchema = 'firealarm-temperature;v1';
var humiditySchema = 'firealarm-humidity;v1';
var emergencyButtonSchema = 'firealarm-emergencybutton;v1'
var interval = "00:00:05";
var buttonInterval = "00:00:01";
var deviceType = "FireAlarm";
var deviceFirmware = "1.0.0";
var deviceFirmwareUpdateStatus = "";
var deviceLocation = "서울 종로구 종로1길 50 KTT A동 12층";
var deviceLatitude = 37.5746492;
var deviceLongitude = 126.9783334;
var deviceOnline = true;

var alertLEDOn = false;
var LED_PIN = 5;
var emergencyButtonOn = 0;

// 센서 초기화
const sensorOptions = {
    i2cBusNo: 1, // defaults to 1
    i2cAddress: BME280.BME280_DEFAULT_I2C_ADDRESS() // defaults to 0x77
};
const bme280 = new BME280(sensorOptions);

bme280.init()
    .then(() => {
        console.log('BME280 initialization succeeded');
    })
    .catch((err) => console.error(`BME280 initialization failed: ${err} `));


var reportedProperties = {
    "Protocol": "MQTT",
    "SupportedMethods": "Reboot,FirmwareUpdate,AlertLEDOn",
    "Telemetry": {
        "TemperatureSchema": {
            "Interval": interval,
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
            "Interval": interval,
            "MessageTemplate": "{\"humidity\":${humidity},\"humidity_unit\":\"${humidity_unit}\"}",
            "MessageSchema": {
                "Name": humiditySchema,
                "Format": "JSON",
                "Fields": {
                    "humidity": "Double",
                    "humidity_unit": "Text"
                }
            }
        },
        "EmergencySchema": {
            "Interval": buttonInterval,
            "MessageTemplate": "{\"emergencyButtonOn\":${emergencyButtonOn}}",
            "MessageSchema": {
                "Name": emergencyButtonSchema,
                "Format": "JSON",
                "Fields": {
                    "emergencyButtonOn": "Integer"
                }
            }
        },
    },
    "Type": deviceType,
    "Firmware": deviceFirmware,
    "FirmwareUpdateStatus": deviceFirmwareUpdateStatus,
    "Location": deviceLocation,
    "Latitude": deviceLatitude,
    "Longitude": deviceLongitude,
    "Online": deviceOnline,
    "AlertLED": alertLEDOn
}

function printErrorFor(op) {
    return function printError(err) {
        if (err) console.log(op + ' error: ' + err.toString());
    };
}

function onDirectMethod(request, response) {
    // Implement logic asynchronously here.
    console.log('--------Simulated ' + request.methodName);

    // Complete the response
    response.send(200, request.methodName + ' was called on the device', function (err) {
        if (err) console.error('Error sending method response :\n' + err.toString());
        else console.log('200 Response to method \'' + request.methodName + '\' sent successfully.');
    });
}

function onAlertLEDOn(request, response) { 
    console.log('---------------------  LED ON');

    // 실제로 LED 를 제어 함. 
    alertLEDOn = true;
    wpi.digitalWrite(LED_PIN, 1);

    var patch = {
        AlertLED: alertLEDOn
    };
    // Twin 업데이트
    client.getTwin(function (err, twin) {
        if (!err) {
            twin.properties.reported.update(patch, function (err) {
                if (err) console.log("------------reported update error")
            });
        } else {
            if (err) console.log("--------------get twin error")
        }
    });

    response.send(200, "Alert LED: " + (alertLEDOn ? "On" : "Off"), function (err) { 
        if (err) console.error('Error sending method response :\n' + err.toString());
        else console.log('200 Response to method \'' + request.methodName + '\' sent successfully.');
    });
}

function onFirmwareUpdate(request, response) {
    // Get the requested firmware version from the JSON request body
    var firmwareVersion = request.payload.Firmware;
    var firmwareUri = request.payload.FirmwareUri;

    // Ensure we got a firmware values
    if (!firmwareVersion || !firmwareUri) {
        response.send(400, 'Missing firmware value', function (err) {
            if (err) console.error('Error sending method response :\n' + err.toString());
            else console.log('400 Response to method \'' + request.methodName + '\' sent successfully.');
        });
    } else {
        // Respond the cloud app for the device method
        response.send(200, 'Firmware update started.', function (err) {
            if (err) console.error('Error sending method response :\n' + err.toString());
            else {
                console.log('200 Response to method \'' + request.methodName + '\' sent successfully.');

                // Run the simulated firmware update flow
                runFirmwareUpdateFlow(firmwareVersion, firmwareUri);
            }
        });
    }
}

// Simulated firmwareUpdate flow
function runFirmwareUpdateFlow(firmwareVersion, firmwareUri) {
    console.log('Simulating firmware update flow...');
    console.log('> Firmware version passed: ' + firmwareVersion);
    console.log('> Firmware URI passed: ' + firmwareUri);
    async.waterfall([
        function (callback) {
            console.log("Image downloading from " + firmwareUri);
            var patch = {
                FirmwareUpdateStatus: 'Downloading image..'
            };
            reportUpdateThroughTwin(patch, callback);
            sleep(10000, callback);
        },
        function (callback) {
            console.log("Downloaded, applying firmware " + firmwareVersion);
            deviceOnline = false;
            var patch = {
                FirmwareUpdateStatus: 'Applying firmware..',
                Online: false
            };
            reportUpdateThroughTwin(patch, callback);
            sleep(8000, callback);
        },
        function (callback) {
            console.log("Rebooting");
            var patch = {
                FirmwareUpdateStatus: 'Rebooting..'
            };
            reportUpdateThroughTwin(patch, callback);
            sleep(10000, callback);
        },
        function (callback) {
            console.log("Firmware updated to " + firmwareVersion);
            deviceOnline = true;
            var patch = {
                FirmwareUpdateStatus: 'Firmware updated',
                Online: true,
                Firmware: firmwareVersion
            };
            reportUpdateThroughTwin(patch, callback);
            callback(null);
        }
    ], function (err) {
        if (err) {
            console.error('Error in simulated firmware update flow: ' + err.message);
        } else {
            console.log("Completed simulated firmware update flow");
        }
    });

    // Helper function to update the twin reported properties.
    function reportUpdateThroughTwin(patch, callback) {
        console.log("Sending...");
        console.log(JSON.stringify(patch, null, 2));

        client.getTwin(function (err, twin) {
            if (!err) {
                twin.properties.reported.update(patch, function (err) {
                    if (err) callback(err);
                });
            } else {
                if (err) callback(err);
            }
        });
    }

    function sleep(milliseconds, callback) {
        console.log("Simulate a delay (milleseconds): " + milliseconds);
        setTimeout(function () {
            callback(null);
        }, milliseconds);
    }
}

function sendTelemetry(data, schema) {
    if (deviceOnline) {
        var d = new Date();
        var payload = JSON.stringify(data);
        var message = new Message(payload);
        message.properties.add('$$CreationTimeUtc', d.toISOString());
        message.properties.add('$$MessageSchema', schema);
        message.properties.add('$$ContentType', 'JSON');

        //console.log('Sending device message data:\n' + payload);
        client.sendEvent(message, printErrorFor('send event'));
    } else {
        console.log('Offline, not sending telemetry');
    }
}

var client = Client.fromConnectionString(connectionString, Protocol);

client.open(function (err) {
    if (err) {
        printErrorFor('open')(err);
    } else {

        // LED Setup
        wpi.setup('wpi');
        wpi.pinMode(LED_PIN, wpi.OUTPUT);

        // Create device Twin
        client.getTwin(function (err, twin) {
            if (err) {
                console.error('Could not get device twin');
            } else {
                console.log('Device twin created');

                twin.on('properties.desired.alertLED', function (delta) {
                    // Handle desired properties set by solution
                    //console.log('Received new desired properties:' + JSON.stringify(delta));

                    // LED On/Off
                    alertLEDOn = (delta == 'on' ? true : false);
                    if (alertLEDOn) wpi.digitalWrite(LED_PIN, 1);
                    else wpi.digitalWrite(LED_PIN, 0);

                    var patch = {
                        AlertLED: alertLEDOn
                    };

                    // Twin 업데이트
                    client.getTwin(function (err, twin) {
                        if (!err) {
                            twin.properties.reported.update(patch, function (err) {
                                if (err) console.log("------------reported update error")
                            });
                        } else {
                            if (err) console.log("--------------get twin error")
                        }
                    });
                });

                // Send reported properties
                twin.properties.reported.update(reportedProperties, function (err) {
                    if (err) throw err;
                    console.log('Twin state reported');
                });

                // Register handlers for all the method names we are interested in.
                // Consider separate handlers for each method.
                client.onDeviceMethod('Reboot', onDirectMethod);
                client.onDeviceMethod('FirmwareUpdate', onFirmwareUpdate);
                client.onDeviceMethod('EmergencyValveRelease', onDirectMethod);

                client.onDeviceMethod('AlertLEDOn', onAlertLEDOn);
                client.onDeviceMethod('SetLEDOn', onDirectMethod);
                client.onDeviceMethod('SetLEDOff', onDirectMethod);
            }
        });

        // Start sending telemetry
        var sendTemperatureInterval = setInterval(function () {
            bme280.readSensorData()
            .then((data) => {
                var temp = {
                    'temperature': data.temperature_C,
                    'temperature_unit': temperatureUnit
                };
                sendTelemetry(temp, temperatureSchema);
                console.log(`temp = ${JSON.stringify(temp, null, 2)}`);
            })
            .catch((err) => {
              console.log(`BME280 read error: ${err}`);
              setTimeout(readSensorData, 2000);
            });
        }, 5000);

        var sendHumidityInterval = setInterval(function () {
            bme280.readSensorData()
            .then((data) => {
                var humi = {
                    'humidity': data.humidity,
                    'humidity_unit': humidityUnit
                };
                sendTelemetry(humi, humiditySchema);
                console.log(`humi = ${JSON.stringify(humi, null, 2)}`);
            })
            .catch((err) => {
              console.log(`BME280 read error: ${err}`);
              setTimeout(readSensorData, 2000);
            });
        }, 5000);

        client.on('error', function (err) {
            printErrorFor('client')(err);
            if (sendTemperatureInterval) clearInterval(sendTemperatureInterval);
            if (sendHumidityInterval) clearInterval(sendHumidityInterval);

            client.close(printErrorFor('client.close'));
        });
    }
});