import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';

const MemberInputScreen = () => {
  const [members, setMembers] = useState(['', '', '', '']);
  const navigation = useNavigation();

  const handleChange = (text, index) => {
    const newMembers = [...members];
    newMembers[index] = text;
    setMembers(newMembers);
  };

  const handleNext = async () => {
    // 新しいゲームドキュメントを作成
    const gameRef = doc(collection(db, 'games'));
    await setDoc(gameRef, { createdAt: new Date() }); // ドキュメントが存在するように初期データを設定

    // membersドキュメントを作成してメンバー情報を保存
    const membersRef = doc(gameRef, 'members', 'membersList');
    await setDoc(membersRef, { members });

    // スコア入力画面にゲームIDを渡して移動
    navigation.navigate('ScoreInput', { gameId: gameRef.id });
  };

  return (
    <View style={styles.container}>
      <Text>メンバーを入力してください:</Text>
      {members.map((member, index) => (
        <TextInput
          key={index}
          style={styles.input}
          value={member}
          onChangeText={(text) => handleChange(text, index)}
        />
      ))}
      <Button title="次へ" onPress={handleNext} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingLeft: 10 }
});

export default MemberInputScreen;
