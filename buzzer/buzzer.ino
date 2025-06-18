#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ESP32Servo.h>  // Use this instead of <Servo.h> for ESP32

// --- Definitions ---
#define SERVO_PIN 14
#define DEVICE_NAME "ESP32-01"
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// --- Global Variables ---
BLECharacteristic* pCharacteristic;
Servo myServo;
int currentPosition = 0; // 0 = closed, 90 = open

// --- BLE Write Callback ---
class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pChar) override {
    std::string value = pChar->getValue();

    if (value.length() == 1) {
      char cmd = value[0];
      if (cmd == '0' && currentPosition != 90) {
        myServo.write(90);
        currentPosition = 90;
        Serial.println("🔓 Door Opened (90°)");
        pChar->setValue("Door Opened");
      } else if (cmd == '1' && currentPosition != 0) {
        myServo.write(0);
        currentPosition = 0;
        Serial.println("🔒 Door Closed (0°)");
        pChar->setValue("Door Closed");
      } else {
        Serial.println("⚠️ Already in target position");
        pChar->setValue("No Action Needed");
      }
    } else {
      Serial.println("❗ Invalid command length");
      pChar->setValue("Invalid Command");
    }
  }
};
