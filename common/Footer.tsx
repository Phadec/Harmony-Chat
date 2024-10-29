import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { footerStyles } from "./Styles";

const Footer: React.FC = () => {
  return (
    <View style={footerStyles.footer}>
      <TouchableOpacity>
        <FontAwesome name="comment" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity>
        <FontAwesome name="phone" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity>
        <FontAwesome name="home" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity>
        <FontAwesome name="user" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity>
        <FontAwesome name="cog" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
