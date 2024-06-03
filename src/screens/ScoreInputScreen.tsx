import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

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
  const [members, setMembers] = useState([]);
  const navigation = useNavigation();
  const route = useRoute();
  const { gameId } = route.params;

  useEffect(() => {
    const fetchMembers = async () => {
      const gameDoc = await getDoc(doc(db, 'games', gameId));
      const memberIds = gameDoc.data().members;
      const memberNames = [];
      for (const memberId of memberIds) {
        const memberDoc = await getDoc(doc(db, 'members', memberId));
        memberNames.push({ id: memberId, name: memberDoc.data().name });
      }
      setMembers(memberNames);
    };

    fetchMembers();
  }, [gameId]);

  const handleChange = (key, value) => {
    setCurrentRound({ ...currentRound, [key]: value });
  };

  const handleNext = async () => {
    const roundsRef = collection(db, 'games', gameId, 'rounds');
    await addDoc(roundsRef, currentRound);

    // メンバーのスコアを更新
    const winnerRef = doc(db, 'members', currentRound.winner);
    const discarderRef = doc(db, 'members', currentRound.discarder);

    await updateDoc(winnerRef, {
      totalPoints: (await getDoc(winnerRef)).data().totalPoints + parseInt(currentRound.winnerPoints, 10)
    });

    await updateDoc(discarderRef, {
      totalPoints: (await getDoc(discarderRef)).data().totalPoints - parseInt(currentRound.discarderPoints, 10)
    });

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
        placeholder="局番号"
        value={currentRound.roundNumber}
        onChangeText={(text) => handleChange('roundNumber', text)}
      />
      <View style={styles.toggleContainer}>
        <Text>ツモ:</Text>
        <Switch
          value={currentRound.isTsumo}
          onValueChange={(value) => handleChange('isTsumo', value)}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text>鳴いているか:</Text>
        <Switch
          value={currentRound.naki}
          onValueChange={(value) => handleChange('naki', value)}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text>リーチかどうか:</Text>
        <Switch
          value={currentRound.reach}
          onValueChange={(value) => handleChange('reach', value)}
        />
      </View>
      <Text>あがった人:</Text>
      <Picker
        selectedValue={currentRound.winner}
        style={styles.picker}
        onValueChange={(itemValue) => handleChange('winner', itemValue)}
      >
        {members.map((member) => (
          <Picker.Item key={member.id} label={member.name} value={member.id} />
        ))}
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="あがり点"
        value={currentRound.winnerPoints}
        onChangeText={(text) => handleChange('winnerPoints', text)}
      />
      <Text>放銃した人:</Text>
      <Picker
        selectedValue={currentRound.discarder}
        style={styles.picker}
        onValueChange={(itemValue) => handleChange('discarder', itemValue)}
      >
        {members.map((member) => (
          <Picker.Item key={member.id} label={member.name} value={member.id} />
        ))}
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="放銃点"
        value={currentRound.discarderPoints}
        onChangeText={(text) => handleChange('discarderPoints', text)}
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
  picker: { height: 50, width: 200 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }
});

export default ScoreInputScreen;
