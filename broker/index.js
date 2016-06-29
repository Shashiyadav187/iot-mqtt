var mosca = require('mosca');
var auth = require('./auth_functions.js'); // funzioni di autenticazione e autorizzazione
var path = require('path');
var persistence = require('./persistence')({
  nedb: true,
  thingspeak: true
});


// Il broker MQTT gira sulla macchina corrente, sulla porta 1883, mentre l'impostazione http, fa si che si apra un server WebSocket per l'interazione da Web browser sulla porta 3000.

var settings = {
  type: 'mqtt',
  mqtt: require('mqtt'),
  json: false,
  port: 1883,
  http: {
    port: 3000,
    bundle: true,
    static: './'
  }
};


var server = new mosca.Server(settings);

var db = new mosca.persistence.LevelUp({ path: path.join(__dirname, './db_levelup') }); // DB storing retained messages
db.wire(server);

var auth_required = auth.credentials.auth_required; // se true necessario LOGGARSI

// fired when a client connects
server.on('clientConnected', function(client) {
    console.log('- Client connected: ', client.id);
});

// fired when a client disconnects
server.on('clientDisconnected', function(client) {
	console.log('- Client Disconnected: ', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {

	if (packet.topic.indexOf('$SYS') == -1){ // non stampiamo i messaggi 'di sistema'
		console.log('Published - Messaggio:\n', packet); // packet.payload.toString('utf8')
		if (client !== null){
      console.log('Client:', client.id);
      persistence.store({sender: client.id, payload: packet.payload.toString('utf8'), channel: packet.topic});
    }
	}

});

// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
	console.log(' -------- New Subscription ----------\n');
	console.log('Topic:', topic);
	console.log('Client:', client.id);
	console.log(' -------- end Subscription ----------\n');
});

// fired when a client unsubscribes to a topic
server.on('unsubscribed', function(topic, client) {
	console.log(' -------- New Unsubscription ----------\n');
	console.log('Topic:', topic);
	console.log('Client:', client.id);
	console.log(' -------- End Unsubscription ----------\n');
});



server.on('ready', setup);

// fired when the mqtt server is ready
function setup() {
	// colleghiamo le funzioni d'autenticazione e autorizzazione a Mosca
	if (auth_required){
		server.authenticate = auth.authenticate;
		server.authorizePublish = auth.authorizePublish;
		server.authorizeSubscribe = auth.authorizeSubscribe;
	}
	// ready
	console.log('- Mosca MQTT server is up and running on port:', settings.port);
	console.log('- WebSocket server on port:', settings.http.port);
}


// The publish function allow to publish a value to MQTT clients.

var message = {
  topic: 'all',
  payload: 'Broker is up and running', // or a Buffer
  qos: 0, // 0, 1, or 2
  retain: false // or true
};

server.publish(message, function() {
  console.log('done!');
});
