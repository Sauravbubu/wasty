import React, { useState } from "react";
import { Alert } from "react-native";
import QRCodeScanner from "./QRCodeScanner"; // or wherever your QRCodeScanner is

const ScanScreen = () => {
  const [scanned, setScanned] = useState(false);

  const handleReadCode = (code: string) => {
    if (!scanned) {
      setScanned(true);
      Alert.alert(
        "Scanned Data",
        code,
        [
          {
            text: "OK",
            onPress: () => setScanned(false),
          },
        ],
        { cancelable: false }
      );
      console.log("Scanned code:", code);
    }
  };

  return <QRCodeScanner onReadCode={handleReadCode} />;
};

export default ScanScreen;