/*
* This script handle telegram webhooks (because HTTPS is required and Heroku provides it).
* At the same time heroku free plan doesn't provides more than on PORT (process.env.PORT), so
* we're using a workaround and get the requests on the same port used by telegram webHooks.
* Actually this was proposed as an improvement for the node-telegram-bot-api:
* https://github.com/yagop/node-telegram-bot-api/issues/73
*/

var TelegramBot = require('node-telegram-bot-api');
var jsonfile = require('jsonfile');
var path = require('path');
var mqttClient = require('./mqtt-client.js');
var config = require('./config.json');
//var mail = require('./components/mailgun.js');

if(!config) throw new Error('config.json file missing!');

var DB_FILE = path.join(__dirname,'/db/auth_folks.json');
var PASSWORD = config.PASSWORD; // used for bot /register action
var token = config.TOKEN_TELEGRAM; // Telegram bot token
var domain = config.DOMAIN; // should be HTTPS

var options = {
  webHook: {
    port: process.env.PORT || 443,
    key: path.join(__dirname,'/key.pem'),
    cert: path.join(__dirname,'/crt.pem')
  }
};
console.log('Port assigned:', options.webHook.port);

var resp;
// Setup polling way
var bot = new TelegramBot(token, options);
bot.setWebHook(domain+':443/bot'+token, __dirname+'/crt.pem');

var last_operation = {chat_id: undefined, timestamp: Math.floor(Date.now() / 1000)}; //timestamp

// Matches /register [whatever]
bot.onText(/\/register (.+)/, function (msg, match) {
  console.log(msg);
  console.log('-----------');
  console.log(match);

  var chatId = msg.from.id;
  var pass = match[1];

  if (pass !== PASSWORD){
      resp = 'Sorry, wrong password.';
      bot.sendMessage(chatId, resp);
      return;
  }

  // chatId-based time constraints.
  if (last_operation.chat_id === chatId && (Math.floor(Date.now() / 1000) - last_operation.timestamp) < 300){ // almeno 5 minuti fra una /register e un'altra per uno stesso utente.
      resp = 'You have to wait at least 5 minutes before a new registration attempt.';
      bot.sendMessage(chatId, resp);
      return;
    }else{
      last_operation.chat_id = chatId;
      last_operation.timestamp = Math.floor(Date.now() / 1000);
  }

  // se non c'è già l'entry nel DB si inserisce il chatId
  jsonfile.readFile(DB_FILE, function(err, obj) {
    if (err) {console.err(err); bot.sendMessage(chatId, err); return;}

    if (obj.indexOf(chatId) === -1){
      // not found, put it
      obj.push(chatId);
      jsonfile.writeFile(DB_FILE, obj, function (err) {
        if (err){console.error(err);bot.sendMessage(chatId, err); return;}
        bot.sendMessage(chatId, 'Successfully registered! :)');
      });
    }else{
      // already registered
      bot.sendMessage(chatId, 'User already registered! :)');
      return;
    }

  });


});

// Matches /pump [(on/off)]
bot.onText(/\/pump (.+)/, function (msg, match) {

  var chatId = msg.from.id;
  var input = match[1].toLowerCase();


  jsonfile.readFile(DB_FILE, function(err, obj){
      if (err){console.log(err); bot.sendMessage(chatId, err); return;}

      // check user is authorized
      if (obj.indexOf(chatId) === -1){
        bot.sendMessage(chatId, 'User not authorized!');
        return;
      }

      // check command is valid
      if(!(input === 'on' || input === 'off')){
        bot.sendMessage(chatId, 'Only "on" or "off" commands accepted for pump.');
        return;
      }

      // send the command through MQTT
      mqttClient.publish('plant/pump', input);

  });


});

// Message from the MQTT Subscriptions
mqttclient.on('message', function (topic, message) {
  // message is Buffer
  console.log('MQTT mex:',message.toString());
  // send the message to every registered user
  jsonfile.readFile(DB_FILE, function(err, obj){
    if (err){ console.log('error reading file',err); return;}
    obj.forEach(function(chat_Id){
      bot.sendMessage(chat_Id, topic+' : '+message.toString());
    });
  });
  //client.end(); close connection
});

// Any kind of message from the USER
bot.on('message', function (msg) {
  var chatId = msg.from.id;
  console.log('Telegram Message: ', msg);
});
