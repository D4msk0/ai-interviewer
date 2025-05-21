// src/components/MessageInput.jsx
import React, { useState } from 'react';

export default function MessageInput({ onSend }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() !== '') {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div style={{ padding: '1rem', display: 'flex' }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ flex: 1, marginRight: '0.5rem' }}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Typ hier je antwoord..."
      />
      <button onClick={handleSend}>Verstuur</button>
    </div>
  );
}
