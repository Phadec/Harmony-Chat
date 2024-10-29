import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Swiper from "react-native-swiper";
import { carouselStyles } from "./Styles";

const images = [
  {
    id: 1,
    uri: "https://www.lowqualitymemes.com/img/low-quality-image-after-compressing.png",
    likes: 113,
  },
  {
    id: 2,
    uri: "https://cdn.prod.website-files.com/6556748787af460127715c31/65e0f4af0b699485254590d0_Rectangle%202507%20(2).png",
    likes: 150,
  },
  {
    id: 3,
    uri: "https://www.lowqualitymemes.com/img/low-quality-image-after-compressing.png",
    likes: 200,
  },
];

const Carousel: React.FC = () => {
  return (
    <View style={carouselStyles.carouselContainer}>
      <LinearGradient colors={["#353F54", "#303642"]} style={carouselStyles.gradient} />
      <BlurView
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        intensity={60}
        tint="dark"
      />
      <View style={carouselStyles.slideContainer}>
        <Swiper
          style={carouselStyles.wrapper}
          showsButtons={false}
          showsPagination={false}
        >
          {images.map((image) => (
            <View key={image.id} style={carouselStyles.slide}>
              <View style={carouselStyles.imageContainer}>
                <Image source={{ uri: image.uri }} style={carouselStyles.image} />
              </View>
              <View style={carouselStyles.infoContainer}>
                <View style={carouselStyles.likesContainer}>
                  <Text style={carouselStyles.likes}>{image.likes}</Text>
                  <TouchableOpacity>
                    <FontAwesome name="heart-o" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </Swiper>
      </View>
    </View>
  );
};

export default Carousel;
