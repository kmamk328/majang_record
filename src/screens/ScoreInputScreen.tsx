import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const ScoreInputScreen = () => {
  const [currentRound, setCurrentRound] = useState({
    discarder: '',
    discarderPoints: '',
    isNaki: false,
    isReach: false,
    roundNumber: { round: '1', place: '東', honba: '1' },
    winner: '',
    winnerPoints: '',
    isTsumo: false,
    roles: []
  });
  const [members, setMembers] = useState([]);
  const [rolesOptions, setRolesOptions] = useState([]);
  const [availablePoints, setAvailablePoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [rounds, setRounds] = useState([]);
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
        backgroundColor: '#E0F8E0',
      },
      headerTintColor: '#000',
      headerTitle: 'スコア入力',
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

    const fetchRounds = async () => {
      const roundsRef = collection(db, 'games', gameId, 'rounds');
      const roundsQuery = query(roundsRef, orderBy('roundNumber'));
      const roundsSnapshot = await getDocs(roundsQuery);
      const roundsData = roundsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRounds(roundsData);
      if (roundsData.length > 0) {
        setCurrentRound(roundsData[0]);
        setCurrentRoundIndex(0);
      }
    };

    const fetchRolesOptions = () => {
      try {
        const rolesData = require('../../roles.txt').default;
        const rolesArray = rolesData.split('\n').map(line => {
          const [role, points] = line.split(',');
          return { role, points: parseInt(points, 10) };
        });
        setRolesOptions(rolesArray);
      } catch (error) {
        console.error('Error reading roles.txt file:', error);
      }
    };

    const fetchAvailablePoints = () => {
      try {
        const pointsData = require('../../points.txt').default;
        const pointsArray = pointsData.split('\n').map(point => parseInt(point, 10));
        setAvailablePoints(pointsArray);
        setFilteredPoints(pointsArray);
      } catch (error) {
        console.error('Error reading points.txt file:', error);
      }
    };

    fetchMembers();
    fetchRounds();
    fetchRolesOptions();
    fetchAvailablePoints();
  }, [gameId]);

  const handleChange = (key, value) => {
    setCurrentRound({ ...currentRound, [key]: value });
  };

  const handleRoundNumberChange = (key, value) => {
    setCurrentRound({ 
      ...currentRound, 
      roundNumber: {
        ...currentRound.roundNumber,
        [key]: value
      }
    });
  };

  const toggleRoleSelection = (role) => {
    const updatedRoles = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(updatedRoles);
    updateFilteredPoints(updatedRoles);
  };

  const updateFilteredPoints = (updatedRoles) => {
    const totalPoints = updatedRoles.reduce((sum, role) => {
      const roleObj = rolesOptions.find(r => r.role === role);
      return sum + (roleObj ? roleObj.points : 0);
    }, 0);

    let newFilteredPoints = availablePoints;
    if (totalPoints >= 2) {
      newFilteredPoints = newFilteredPoints.filter(point => point >= 2000);
    }
    if (totalPoints >= 4) {
      newFilteredPoints = newFilteredPoints.filter(point => point >= 8000);
    }

    setFilteredPoints(newFilteredPoints);
  };

  const handleNext = async () => {
    const roundsRef = collection(db, 'games', gameId, 'rounds');
    await addDoc(roundsRef, {
      ...currentRound,
      isTsumo: isTsumo,
      isNaki: isNaki,
      isReach: isReach,
      discarder: discarder,
      discarderPoints: discarderPoints,
      roles: selectedRoles // 役を保存
    });

    const winnerRef = doc(db, 'members', currentRound.winner);
    const discarderRef = doc(db, 'members', discarder);

    await updateDoc(winnerRef, {
      totalPoints: (await getDoc(winnerRef)).data().totalPoints + parseInt(currentRound.winnerPoints, 10)
    });

    await updateDoc(discarderRef, {
      totalPoints: (await getDoc(discarderRef)).data().totalPoints - parseInt(discarderPoints, 10)
    });

    setCurrentRound({
      discarder: '',
      discarderPoints: '',
      isNaki: false,
      isReach: false,
      roundNumber: { round: '1', place: '東', honba: '1' },
      winner: '',
      winnerPoints: '',
      isTsumo: false,
      roles: []
    });
    setIsTsumo(false);
    setIsNaki(false);
    setIsReach(false);
    setDiscarder('');
    setDiscarderPoints('');
    setSelectedRoles([]);

    try {
      await setDoc(doc(firestore, "games", gameId, "rounds", "currentRound"), {
        ...currentRound,
        isTsumo: isTsumo,
        isNaki: isNaki,
        isReach: isReach,
        discarder: discarder,
        discarderPoints: discarderPoints,
        roles: selectedRoles // 役を保存
      });
      console.log("Round data saved successfully!");
    } catch (error) {
      console.error("Error saving round data: ", error);
    }

    navigation.push('ScoreInput', { gameId });
  };

  const handlePrevious = () => {
    if (currentRoundIndex > 0) {
      const newIndex = currentRoundIndex - 1;
      setCurrentRound(rounds[newIndex]);
      setCurrentRoundIndex(newIndex);
    }
  };

  const handleFinish = () => {
    navigation.navigate('Result', { gameId });
  };

  const confirmRolesSelection = () => {
    setCurrentRound({ ...currentRound, roles: selectedRoles });
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text>局ごとの成績を入力してください:</Text>
      <View style={styles.roundNumberContainer}>
        <Picker
          selectedValue={currentRound.roundNumber.place}
          style={styles.picker}
          onValueChange={(itemValue) => handleRoundNumberChange('place', itemValue)}
        >
          {['東', '南', '西', '北'].map((place) => (
            <Picker.Item key={place} label={place} value={place} />
          ))}
        </Picker>
        <Picker
          selectedValue={currentRound.roundNumber.round}
          style={styles.picker}
          onValueChange={(itemValue) => handleRoundNumberChange('round', itemValue)}
        >
          {[1, 2, 3, 4].map((round) => (
            <Picker.Item key={round} label={round.toString()} value={round.toString()} />
          ))}
        </Picker>
        <Picker
          selectedValue={currentRound.roundNumber.honba}
          style={styles.picker}
          onValueChange={(itemValue) => handleRoundNumberChange('honba', itemValue)}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((honba) => (
            <Picker.Item key={honba} label={honba.toString()} value={honba.toString()} />
          ))}
        </Picker>
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
      <Text>あがり点:</Text>
      <Picker
        selectedValue={currentRound.winnerPoints}
        style={styles.picker}
        onValueChange={(itemValue) => handleChange('winnerPoints', itemValue)}
      >
        {filteredPoints.map((point, index) => (
          <Picker.Item key={index} label={point.toString()} value={point.toString()} />
        ))}
      </Picker>
      <Text>あがった役:</Text>
      <View style={styles.tagsContainer}>
        {selectedRoles.map((role, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tag}
          >
            <Text style={styles.tagText}>{role}</Text>
          </TouchableOpacity>
        ))}
        <Button title="あがった役を選択" onPress={() => setModalVisible(true)} />
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>あがった役を選択</Text>
          <ScrollView>
            {rolesOptions.map((roleObj, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tag,
                  selectedRoles.includes(roleObj.role) && styles.tagSelected
                ]}
                onPress={() => toggleRoleSelection(roleObj.role)}
              >
                <Text style={styles.tagText}>{roleObj.role} ({roleObj.points}点)</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button title="OK" onPress={confirmRolesSelection} />
        </View>
      </Modal>
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
        <Button title="前へ" onPress={handlePrevious} />
        <Button title="次へ" onPress={handleNext} />
        <Button title="終了" onPress={handleFinish} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingLeft: 10 },
  picker: { height: 50, width: 100 },
  roundNumberContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 },
  tag: { padding: 10, margin: 5, borderRadius: 5, borderWidth: 1, borderColor: 'gray' },
  tagSelected: { backgroundColor: 'lightgreen' },
  tagText: { fontSize: 16 },
  modalView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, marginBottom: 20 }
});

export default ScoreInputScreen;
