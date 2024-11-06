import { cameraPreviewStyles } from "~/common/Styles";
import { Icons } from "~/common/Svg";
import React from "react";
import {
  ImageBackground,
  TouchableOpacity,
  View
} from "react-native";

export const CameraPreview = ({ photo, retakePicture, sendPhoto }: any) => {
  return (
    <View style={cameraPreviewStyles.container}>
      {photo && photo.uri ? (
        <ImageBackground
          source={{ uri: photo.uri }}
          style={cameraPreviewStyles.imageBackground}
        >
          {/* Các nút Retake và Send */}
          <View style={cameraPreviewStyles.buttonContainer}>
            <TouchableOpacity
              onPress={retakePicture}
              style={cameraPreviewStyles.button}
            >
              <Icons.RetakePhoto />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={sendPhoto}
              style={cameraPreviewStyles.button}
            >
              <Icons.Send />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      ) : (
        <View style={cameraPreviewStyles.placeholder}></View>
      )}
    </View>
  );
};
