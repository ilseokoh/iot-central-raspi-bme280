'use stric';

var config = require('./config.json');
var MessageProcessor = require('./messageProcessor.js');

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var wpi = require('wiring-pi');

var connectionString = config.clientFromConnectionString; 
var client = clientFromConnectionString(connectionString); 


// Message 
messageProcessor = new MessageProcessor(config);


