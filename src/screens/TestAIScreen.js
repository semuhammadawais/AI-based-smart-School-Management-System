import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';

import {testGemini} from '../services/GroqService';

const TestAIScreen = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleTest = async () => {
    setLoading(true);

    const aiResponse = await testGemini();

    setResponse(aiResponse);
    setLoading(false);
  };

  return (
    <View style={{flex: 1, padding: 20}}>
      <TouchableOpacity
        onPress={handleTest}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 10,
        }}>
        <Text style={{color: 'white'}}>Test Gemini</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Text style={{marginTop: 20, color: 'black'}}>{response}</Text>
      )}
    </View>
  );
};

export default TestAIScreen;
