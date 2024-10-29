import { Icons } from "@/common/Svg";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { modalStyles } from "./Styles";

const CustomModal = () => {
  const [modalVisible, setModalVisible] = useState(true);

  const handleOpenGallery = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (event: any) => {
        const file = event.target.files[0];
        // Xử lý file ở đây
        console.log(file);
      };
      input.click();
    } else {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        alert("Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const source = { uri: result.assets[0].uri };
        console.log("Image URI: ", source.uri);
        // Xử lý ảnh đã chọn ở đây
      }
    }
  };

  return (
    <View style={modalStyles.container}>
      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={modalStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icons.Close />
            </TouchableOpacity>

            <View style={modalStyles.itemContainer}>
              <TouchableOpacity
                activeOpacity={0.96}
                onPress={handleOpenGallery}
              >
                <LinearGradient
                  colors={["#353F54", "#292F3B"]}
                  style={modalStyles.item}
                >
                  <Icons.UpdatePhoto />
                  <Text style={modalStyles.subText}>Feed</Text>
                  <Text style={modalStyles.mainText}>Update Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.96}>
                <LinearGradient
                  colors={["#353F54", "#292F3B"]}
                  style={modalStyles.item}
                >
                  <Icons.SendMess />
                  <Text style={modalStyles.subText}>Message</Text>
                  <Text style={modalStyles.mainText}>Send Mess</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomModal;
