/*
PC MQTT client
*/

var mqtt    = require('mqtt');

var client  = mqtt.connect('mqtt://192.168.1.111', {
	clientId: 'plant-worker',
	keepalive:15,
	will: {topic: 'graveyard/', payload: new Buffer('I am dead.')}
 });
// for more options watch this: https://github.com/mqttjs/MQTT.js#client

// Event Handling:

client.on('connect', function () {
	// Emitted on successful (re)connection
	console.log("Client connected.");
	client.subscribe('plant/pump/status');
	client.publish('all/', 'Hello mqtt...');
});


client.on('offline', function(){
	// Emitted when the client goes offline
	console.log('Client offline');
});

client.on('close', function(){
	// Emitted after a disconnection
	console.log('Client disconnected');
});

client.on('reconnect', function(){
	// Emitted when a reconnect starts
	console.log('Client reconnecting..');
});

client.on('error', function(){
	// Emitted when the client cannot connect
	console.log('Client error.');
});

module.exports = client;
