Sketch for MQTT Self-watering plant. (for esp8266 or NodeMCU/Wemos boards).
Broker and Wifi Credentials configurable via access point and captive portal (thanks to Wifi Manager).

# Main Dependencies:
- WifiManager
- MQTT PubSubClient

# Used PINs:

    // DHT Sensor
    #define DHTPIN D4

    // Relay pin
    const int relayPin = D1;

### Possible Improvements:

Soil Mosture and light level.
