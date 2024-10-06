import React from "react";
import { View, Text } from "react-native";

class SlashScreen extends React.Component {

    render(): React.ReactNode {
        return (
            <View style={{
                alignItems: 'center',
                margin: 'auto'
            }}>
                <Text style={{
                    fontWeight: 'bold'
                }}>
                    Harmony
                </Text>
            </View>
        )   
    }
}