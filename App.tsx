import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
    return (
        <View style={styles.containers}>
            <Text>Hello World!</Text> 
            <StatusBar style="auto" />
        </View>
    )
}

const styles = StyleSheet.create({
    containers: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    }
})