
import styled from 'styled-components/native';
import {BackgroundLogin, Facebook, Google, Zalo} from '~/assets/imgs/Images'
import { ImageBackground, View, Text, TouchableOpacity } from "react-native";

function Login() {
    return (
        <ImageBackground 
          source={BackgroundLogin}
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          resizeMode="cover"
        >
            <Main>        
                <Container>
                    <Title>Harmony</Title>
                    <View style={{
                        width: '90%',
                        marginBottom: 16
                    }}>
                      <Subtitle>Connect friends</Subtitle>
                      <Subtitle style={{
                        fontWeight: '700'
                      }}>easily & quickly</Subtitle>
                    </View>
                    <Description>
                        Our chat app is the perfect way to stay connected with friends and family.
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
                    <StyledButton onPress={() => { }}>
                      <Text
                        style={{
                          textAlign: 'center',
                          fontSize: 20,
                          fontWeight: 500
                        }}
                      >
                        Sign up with mail
                      </Text>
                    </StyledButton>
                    <TextContainer>
                        <ExistingAccountText>Forget account?</ExistingAccountText>
                        <TouchableOpacity onPress={() => { }}>
                          <Text
                            style={{
                              color: '#fff',
                              fontWeight: 'bold'
                            }}
                          >
                            Forget
                          </Text>
                        </TouchableOpacity>
                    </TextContainer>
                </Container>
            </Main>
        </ImageBackground>
    );
}

const Main = styled.SafeAreaView`
    height: 100%;
`

const Container = styled.View`
  height: 100%;
  padding: 20px 24px 38px 24px;
`;

const Title = styled.Text`
  font-size: ${16}px;
  font-weight: bold;
  text-align: center;
  color: #fff;
  margin-bottom: 46px;
`;

const Subtitle = styled.Text`
  font-size: 65px;
  color: #fff;
`;

const Description = styled.Text`
  font-size: 16px;
  text-align: left;
  color: #888;
  margin-bottom: 30px;
`;

const ButtonContainer = styled.View`
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`;

const IconButton = styled.ImageBackground`
  width: ${48}px;
  height: ${48}px;
  margin-left: 20px;
`;

const StyledButton = styled.TouchableOpacity`
  background-color: #fff;
  color: #000;
  padding: 16px 88px;
  border-radius: 16px;
  margin-bottom: 46px;
`;

const Line = styled.View`
  flex: 1;
  height: 2px;
  background-color: #ccc;
`;

const OrText = styled.Text`
  font-size: 16px;
  text-align: center;
  color: #fff;
  margin: 0 16px;
`;

const TextContainer = styled.View`
  flex-direction: row;
  margin-top: 20px;
  justify-content: center;
`;

const ExistingAccountText = styled.Text`
  font-size: 16px;
  color: #ccc;
  margin-right: 10px;
`;

export default Login;