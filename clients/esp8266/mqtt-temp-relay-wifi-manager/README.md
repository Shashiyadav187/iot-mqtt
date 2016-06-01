Sketch for MQTT Self-watering plant. (for esp8266 or NodeMCU/Wemos boards).
MQTT Broker and Wifi Credentials configurable via access point and captive portal (thanks to Wifi Manager).

# Main Dependencies:
- WifiManager
- MQTT PubSubClient

# Used PINs:

    // DHT Sensor
    #define DHTPIN D4

    // Relay pin
    const int relayPin = D1;

# Used MQTT Channels

The Board publishes every 30 secs on these two channels, respectively, current humidity and temperature:

    plant/humidity
    plant/temperature

It also subscribes to

    plant/pump

Waiting for 1/0 to turn ON or OFF the water Pump.
The water pump status (ON/OFF) is back published on the channel:

    plant/pump/status

### Possible Improvements:

Soil Mosture and light level.
