import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { getFirestore, collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

const ScoreInputScreen = () => {
  
  const [currentRound, setCurrentRound] = useState({
    discarder: '',
    discarderPoints: '',
    isNaki: false,
    isReach: false,
    roundNumber: '',
    winner: '',
    winnerPoints: '',
    isTsumo: false
  });
  const [members, setMembers] = useState([]);
  const navigation = useNavigation();
  const route = useRoute();
  const { gameId } = route.params;
  const [isTsumo, setIsTsumo] = useState(false);
  const [isNaki, setIsNaki] = useState(false);
  const [isReach, setIsReach] = useState(false);
  const [discarder, setDiscarder] = useState('');
  const [discarderPoints, setDiscarderPoints] = useState('');
  const firestore = getFirestore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#E0F8E0', // 薄い緑色
      },
      headerTintColor: '#000', // 必要に応じてテキストの色を変更
      headerTitle: 'スコア入力', // ヘッダータイトル
    });
  }, [navigation]);

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
    // await addDoc(roundsRef, currentRound);
    await addDoc(roundsRef, {
      ...currentRound,
      isTsumo: isTsumo,
      isNaki: isNaki,
      isReach: isReach,
      discarder: discarder,
      discarderPoints: discarderPoints
      });

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
      isNaki: false,
      isReach: false,
      roundNumber: '',
      winner: '',
      winnerPoints: '',
      isTsumo: false
    });
    setIsTsumo(false);
    setIsNaki(false);
    setIsReach(false);
    setDiscarder('');
    setDiscarderPoints('');
    // try {
    //   await setDoc(doc(firestore, "games", "currentGame", "rounds", "currentRound"), currentRound);
    //   console.log("Round data saved successfully!");
    // } catch (error) {
    //   console.error("Error saving round data: ", error);
    // }
    try {
      await setDoc(doc(firestore, "games", gameId, "rounds", "currentRound"), {
        ...currentRound,
        isTsumo: isTsumo,
        isNaki: isNaki,
        isReach: isReach,
        discarder: discarder,
        discarderPoints: discarderPoints
      });
      console.log("Round data saved successfully!");
    } catch (error) {
      console.error("Error saving round data: ", error);
    }
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
      {/* <View style={styles.toggleContainer}>
        <Text>ツモ:</Text>
        <Switch
          value={currentRound.isTsumo}
          onValueChange={(value) => handleChange('isTsumo', value)}
        />
      </View> */}
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
      <View style={styles.toggleContainer}>
      <Text>ツモ:</Text>
        <Switch
          value={isTsumo}
          onValueChange={(value) => setIsTsumo(value)}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text>鳴いているか:</Text>
        <Switch
          value={isNaki}
          onValueChange={(value) => setIsNaki(value)}
        />
      </View>
      <View style={styles.toggleContainer}>
        <Text>リーチかどうか:</Text>
        <Switch
          value={isReach}
          onValueChange={(value) => setIsReach(value)}
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder="あがり点"
        value={currentRound.winnerPoints}
        onChangeText={(text) => handleChange('winnerPoints', text)}
      />
      {!isTsumo && (
        <>
          <Text>放銃した人:</Text>
          <TextInput
            value={discarder}
            onChangeText={setDiscarder}
          />
          <Text>放銃点:</Text>
          <TextInput
            value={discarderPoints}
            onChangeText={setDiscarderPoints}
            keyboardType="numeric"
          />
        </>
      )}
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
