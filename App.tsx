import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MemberInputScreen from './src/screens/MemberInputScreen';
import ScoreInputScreen from './src/screens/ScoreInputScreen';
import ResultScreen from './src/screens/ResultScreen';
// import MemberInputScreen from './src/components/MemberInputScreen';
// import ScoreInputScreen from './src/components/ScoreInputScreen';
// import ResultScreen from './src/components/ResultScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MemberInput">
        <Stack.Screen name="MemberInput" component={MemberInputScreen} />
        <Stack.Screen name="ScoreInput" component={ScoreInputScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
