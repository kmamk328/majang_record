import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const ResultScreen = () => {
  const [result, setResult] = useState([]);
  const route = useRoute();
  const { gameId } = route.params;

  useEffect(() => {
    const fetchData = async () => {
      const roundsRef = collection(db, 'games', gameId, 'rounds');
      const roundsSnapshot = await getDocs(roundsRef);
      const rounds = roundsSnapshot.docs.map(doc => doc.data());
      setResult(rounds);
    };
    fetchData();
  }, [gameId]);

  return (
    <View style={styles.container}>
      <Text>結果:</Text>
      {result.map((res, index) => (
        <Text key={index}>{JSON.stringify(res)}</Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 }
});

export default ResultScreen;
