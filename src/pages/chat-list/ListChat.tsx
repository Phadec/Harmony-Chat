import Carousel from "~/common/Carousel";
import Footer from "~/common/Footer";
import Header from "~/common/Header";
import { Background } from "~/common/Svg";
import React from "react";
import { View } from "react-native";
import Nav from "~/common/Nav";
import { screenStyles } from "~/common/Styles";
import MessageList from "./MessageList";

const MessageListScreen: React.FC = () => {
  return (
    <View style={[screenStyles.container, { backgroundColor: "#242C3B" }]}>
      <Background />
      <Header />
      <Carousel />
      <Nav />
      <MessageList />
      <Footer />
    </View>
  );
};

export default MessageListScreen;
