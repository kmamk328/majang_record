import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const ScoreInputScreen = () => {
  const [currentRound, setCurrentRound] = useState({
    discarder: '',
    discarderPoints: '',
    naki: false,
    reach: false,
    roundNumber: '',
    winner: '',
    winnerPoints: ''
  });
  const navigation = useNavigation();
  const route = useRoute();
  const { gameId } = route.params;

  const handleChange = (key, value) => {
    setCurrentRound({ ...currentRound, [key]: value });
  };

  const handleNext = async () => {
    const roundsRef = collection(db, 'games', gameId, 'rounds');
    await addDoc(roundsRef, currentRound); // 自動生成されたドキュメントIDでラウンド情報を保存
    setCurrentRound({
      discarder: '',
      discarderPoints: '',
      naki: false,
      reach: false,
      roundNumber: '',
      winner: '',
      winnerPoints: ''
    });
  };

  const handleFinish = () => {
    navigation.navigate('Result', { gameId });
  };

  return (
    <View style={styles.container}>
      <Text>局ごとの成績を入力してください:</Text>
      <TextInput
        style={styles.input}
        placeholder="放銃した人"
        value={currentRound.discarder}
        onChangeText={(text) => handleChange('discarder', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="放銃点"
        value={currentRound.discarderPoints}
        onChangeText={(text) => handleChange('discarderPoints', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="鳴いているか (true/false)"
        value={currentRound.naki.toString()}
        onChangeText={(text) => handleChange('naki', text === 'true')}
      />
      <TextInput
        style={styles.input}
        placeholder="リーチかどうか (true/false)"
        value={currentRound.reach.toString()}
        onChangeText={(text) => handleChange('reach', text === 'true')}
      />
      <TextInput
        style={styles.input}
        placeholder="局番号"
        value={currentRound.roundNumber}
        onChangeText={(text) => handleChange('roundNumber', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="あがった人"
        value={currentRound.winner}
        onChangeText={(text) => handleChange('winner', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="あがり点"
        value={currentRound.winnerPoints}
        onChangeText={(text) => handleChange('winnerPoints', text)}
      />
      <View style={styles.buttonContainer}>
        <Button title="次へ" onPress={handleNext} />
        <Button title="終了" onPress={handleFinish} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingLeft: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' }
});

export default ScoreInputScreen;
