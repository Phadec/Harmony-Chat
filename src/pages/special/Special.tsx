import Footer from "~/common/Footer";
import { Background } from "~/common/Svg";
import { BlurView } from "expo-blur";
import React from "react";
import { View } from "react-native";
import Header from "~/common/Header";
import Nav from "~/common/Nav";
import { screenStyles } from "~/common/Styles";
import RecentList from "./ListSpecial";

const SpecialScreen: React.FC = () => {
  return (
    <View style={screenStyles.container}>
      <Background />
      <BlurView
        style={screenStyles.backGround}
        intensity={80}
        tint="systemThinMaterialDark"
      >
        <Header />
        <Nav />
        <RecentList />
        <Footer />
      </BlurView>
    </View>
  );
};

export default SpecialScreen;
