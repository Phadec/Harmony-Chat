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
          <HeaderText>Sign up with Email</HeaderText>
          <Underline />
        </Header>
        <Description>
            Get chatting with friends and family today by signing up for our chat app!
        </Description>
        <Form>
            <Label>Your name</Label>
            <InpText />
            <Label>Your email</Label>
            <InpText />
            <Label>Password</Label>
            <InpText />
            <Label>Confirm Password</Label>
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
            Create an account
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
  width: 52px;
  height: 10px;
  right: 26%;
  background-color: #41B2A4;
  top: 120%;
`;

const Description = styled.Text`
  font-size: 16px;
  color: #ccc;
  text-align: center;
  font-weight: 400;
  margin-bottom: 30px;
`

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