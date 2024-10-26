import React from "react";
import { TouchableOpacity, Text, View, TextInput, Button } from "react-native";
import styled from "styled-components/native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import { Facebook, Google, Zalo } from '~/assets/imgs/Images';

function Register() {
    return (
      <Main>
        <TouchableOpacity>
          <FontAwesomeIcon icon={faArrowLeftLong} />
        </TouchableOpacity>
        <Header>
          <HeaderText>Login to Harmony</HeaderText>
          <Underline />
        </Header>
        <Description>
            Welcome back! Sign in using your social account or email to continue us
        </Description>
        <ButtonContainer>
            <IconButton source={Facebook} />
            <IconButton source={Google} />
            <IconButton source={Zalo} />
        </ButtonContainer>
        <View style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: 30,
                  marginBottom: 30,
                  alignItems: 'center'
                }}>
            <Line />
            <OrText>Or</OrText>
            <Line />
        </View>
        <Form>
            <Label>Your email</Label>
            <InpText />
            <Label>Password</Label>
            <InpText />
        </Form>
        <TouchableOpacity
          style={{
            backgroundColor: '#f3f6f6',
            paddingTop: 16,
            paddingBottom: 16,
            marginBottom: 16,
            borderRadius: 16
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              color: '#797B7C'
            }}
          >
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text
            style={{
              textAlign: 'center',
              color: '#007AFF'
            }}
          >
          Forgot password?
          </Text>
        </TouchableOpacity>
      </Main>
    );
}

const Main = styled.View`
    background-color: #fff;
    display: flex;
    flex-direction: column;
    margin: 17px 39px 35px;
`

const Header = styled.View`
  padding: 16px;
  align-items: center;
  position: relative;
  margin-bottom: 19px;
`;

const HeaderText = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  z-index: 1;
`;

const Underline = styled.View`
  position: absolute;
  width: 60px;
  height: 10px;
  left: 27%;
  background-color: #007AFF;
  top: 120%;
`;

const Description = styled.Text`
  font-size: 16px;
  color: #ccc;
  text-align: center;
  font-weight: 400;
  margin-bottom: 30px;
`

const ButtonContainer = styled.View`
  margin: 0px auto;
  width: 70%;
  margin-bottom: 30px;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`;

const IconButton = styled.ImageBackground`
  width: ${48}px;
  height: ${48}px;
  margin-left: 20px;
`;

const Line = styled.View`
  flex: 1;
  height: 2px;
  background-color: #ccc;
`;

const OrText = styled.Text`
  font-size: 16px;
  text-align: center;
  color: #ccc;
  margin: 0 16px;
`;

const Form = styled.View`
  margin-bottom: 177px;
`

const Label = styled.Text`
  color: #24786D;
`

const InpText = styled.TextInput`
  height: 40px;
  border-bottom-width: 1px;
  border-bottom-color: #000;
  underline-color-android: transparent;
  margin-bottom: 30px;
`;

export default Register;