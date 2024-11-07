
import { View, Text } from "react-native";

class SlashScreen extends React.Component {

    render(): React.ReactNode {
        return (
            <View style={{
                alignItems: 'center',
                margin: 'auto',
                backgroundColor: '#fff'
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