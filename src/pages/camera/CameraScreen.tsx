import { cameraScreenStyles } from "@/common/Styles";
import { Icons } from "@/common/Svg";
import { useNavigation } from "@react-navigation/native";
import { Camera, CameraView } from "expo-camera";
import { CameraType, FlashMode } from "expo-camera/build/legacy/Camera.types";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { CameraPreview } from "./CameraPreview";

export default function CameraScreen() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<any>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchLastPhoto();
  }, []);

  const startCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setIsCameraActive(true);
    } else {
      Alert.alert("Camera access denied");
    }
  };

  const fetchLastPhoto = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      const album = await MediaLibrary.getAssetsAsync({
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: "photo",
        first: 1,
      });
      if (album.assets.length > 0) {
        setLastPhotoUri(album.assets[0].uri);
      }
    } else {
      Alert.alert("Permission to access media library is required!");
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    setPreviewVisible(true);
    setCapturedImage(photo);
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setPreviewVisible(false);
    startCamera();
  };

  // logic gửi ảnh cho đối phương sau khi chụp
  const sendCapturedPhoto = () => {
    if (!capturedImage) return;
    // Logic gửi ảnh cho đối phương
    console.log("Sending photo:", capturedImage.uri);
    navigation.goBack();
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      handleSendSelectedPhotos(result.assets);
    }
  };

  // logic gửi ảnh cho đối phương sau khi chọn ảnh từ thư viện
  const handleSendSelectedPhotos = (photos: any[]) => {
    if (photos.length > 0) {
      setIsCameraActive(false);
      console.log("Sending selected photos:", photos);
      navigation.goBack();
    }
  };

  const toggleFlash = () => {
    setFlashMode((prevMode) =>
      prevMode === FlashMode.off ? FlashMode.on : FlashMode.off
    );
  };

  const switchCamera = () => {
    setCameraType((prevType) =>
      prevType === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const getFlashMode = () =>
    flashMode === FlashMode.off ? FlashMode.off : FlashMode.on;

  return (
    <View style={{ flex: 1 }}>
      {previewVisible && capturedImage ? (
        <CameraPreview
          photo={capturedImage}
          sendPhoto={sendCapturedPhoto}
          retakePicture={retakePicture}
        />
      ) : (
        <CameraView
          style={cameraScreenStyles.viewContainer}
          ref={cameraRef}
          flash={getFlashMode()}
          facing={cameraType}
        >
          {/* Top Controls */}
          <View style={cameraScreenStyles.topBar}>
            <TouchableOpacity
              onPress={toggleFlash}
              style={cameraScreenStyles.flashButton}
            >
              {flashMode === FlashMode.off ? (
                <Icons.FlashOn />
              ) : (
                <Icons.FlashOff />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={cameraScreenStyles.exitButton}
            >
              <Icons.CloseWhite />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={cameraScreenStyles.bottomBar}>
            <TouchableOpacity
              onPress={openGallery}
              style={cameraScreenStyles.iconButton}
            >
              {lastPhotoUri ? (
                <Image
                  source={{ uri: lastPhotoUri }}
                  style={cameraScreenStyles.galleryImage}
                />
              ) : (
                <Text style={cameraScreenStyles.iconText}>Gallery</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={takePicture}>
              <Icons.Capture />
            </TouchableOpacity>
            <TouchableOpacity onPress={switchCamera}>
              <Icons.FlipCamera />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}
