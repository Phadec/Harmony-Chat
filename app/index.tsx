import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IncomingCallScreen from "../pages/call/IncomingCallScreen";
import OngoingCallScreen from "@/pages/call/OngoingCallScreen";
export default function Page() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* <View style={styles.container}>
        <View style={styles.main}>
          <Text style={styles.title}>Hello World</Text>
          <Text style={styles.subtitle}>This is the first page of your app.</Text>
        </View>
      </View> */}
      {/* <IncomingCallScreen /> */}
      <OngoingCallScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
