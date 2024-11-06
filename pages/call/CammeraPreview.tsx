import React, { useRef, useState } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

interface CameraPreviewProps {
  style?: StyleProp<ViewStyle>;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ style }) => {
  return <View style={[styles.container, style]}></View>;
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 150,
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    borderColor: "white",
    shadowColor: "#000",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

export default CameraPreview;
