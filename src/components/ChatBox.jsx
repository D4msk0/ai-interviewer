// src/components/ChatBox.jsx
import React from 'react';

export default function ChatBox({ messages }) {
  return (
    <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
      {messages.map((msg, index) => (
        <div key={index} style={{ marginBottom: '0.5rem' }}>
          <strong>{msg.sender}:</strong> {msg.text}
        </div>
      ))}
    </div>
  );
}
