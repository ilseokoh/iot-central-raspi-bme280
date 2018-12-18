'use strict';

var config = require('./config.json');
var MessageProcessor = require('./messageProcessor.js');

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;

var connectionString = config.deviceConnectionString; 
var client = clientFromConnectionString(connectionString); 

// Message 
function handleDisigredSettings(twin) { 
    twin.on('properties.desired', function (desiredChange) { 
        // for (let setting in desiredChange) { 
        //     if (settings[setting]) { 
        //         console.log('Received setting: ${setting}: ${desiredChange[setting].value}');
        //         settings[setting](desiredChange[setting].value, (newValue, status, message) => {
        //             var patch = {
        //                 [setting]: { 
        //                     value: newValue,
        //                     status: status, 
        //                     desiredVersion: desiredChange.$version, 
        //                     message: message
        //                 }
        //             }
        //             twin.properties.reported.update(patch, (err) => console.log(`Sent setting update for ${setting}; ` +
        //             (err ? `error: ${err.toString()}` : `status: success`)));
        //         });
        //     }
        // }
    });
}

var connectCallback = (err) => { 
    if (err) { 
        console.log('Device could not connect to Azure IoT Central: ${err.toString()');
    } else { 
        console.log('Device successfully connected to Azure IoT Central'); 
        // 주기적으로 Telemetry 보냄. 
        setInterval(MessageProcessor.sendSensorData, config.interval); 
        // TODO: 보내기 실패시 큐에 넣어서 보관하다가 연결되면 보냄. 

        // Twin 설정 
        client.getTwin((err, twin) => { 
            if (err) { 
                console.log('Error getting device twin: ${err.toString()}');
            } else { 
                // 연결되면 한번 디바이스 정보를 보낸다. 
                MessageProcessor.sendDeviceProperties(twin); 
                // IoT Central에서 보낸 변경된 설정 값 (fanSpeed, setTemperature)에 대한 처리 핸들러 
                handleDisigredSettings(twin);
            }
        });
    }
}; 

// Azure IoT Central에 연결 
client.open(connectCallback); 