import React from "react";
import { View, Text, Button } from "react-native";

export default function Login() {
    return (
        <View>
            <Text>
                Harmony
            </Text>
            <Text>
                Connect friends <span>easily & quickly</span>
            </Text>
            <Text>
                Our chat app is the perfect way to stay
                connected with friends and family.
            </Text>
            <View>
                <Button title=""/>
                <Button title=""/>
                <Button title=""/>
            </View>
            <Text>Or</Text>
            <Button title="Sign up with mail"/>
            <Text>
                Existing account? <Button title="Log in"/>
            </Text>
        </View>
    )
}