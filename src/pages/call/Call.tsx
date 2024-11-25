import { Background } from "~/common/Svg";
import { BlurView } from "expo-blur";

import { View } from "react-native";
import Footer from "~/common/Footer";
import Header from "~/common/Header";
import Nav from "~/common/Nav";
import { screenStyles } from "~/common/Styles";
import { ListCalls } from "./ListCalls";

const CallListScreen: React.FC = () => {
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
        <ListCalls />
        <Footer />
      </BlurView>
    </View>
  );
};


export default CallListScreen;
