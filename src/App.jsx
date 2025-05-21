import React, { useState } from 'react';
import ChatBox from './components/ChatBox';
import MessageInput from './components/MessageInput';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'AI', text: 'Als jij iets zou mogen ontwerpen voor de wereld van morgen — wat zou je dan maken?' },
  ]);
  const [imageUrl, setImageUrl] = useState(null);

  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const systemPrompt = `
Je bent een creatieve, nieuwsgierige en toegankelijke AI-interviewer.
Je taak is om studenten te helpen nadenken over hun eigen design-ideeën voor de toekomst.

Je stelt gerichte, maar open vragen om hun ideeën te verkennen, zoals:
- Wat wil je maken of ontwerpen?
- Voor wie is het bedoeld?
- Welk probleem lost het op?
- Hoe zou het eruit kunnen zien of werken?
- Welke materialen of technologieën wil je gebruiken?

Je reageert altijd met een vraag of reflectie die hen helpt hun idee te verdiepen of verbeelden.
Je houdt het positief, prikkelend en kort (max 3-4 zinnen).
  `;

  async function fetchGPTResponse(userInput) {
    const gptMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.sender === "AI" ? "assistant" : "user",
        content: m.text,
      })),
      { role: "user", content: userInput }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: gptMessages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return "Er ging iets mis met de AI-service: " + data.error.message;
    }

    return data.choices[0].message.content;
  }

  async function fetchImage(prompt) {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: "512x512"
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("DALL·E error:", data.error);
      return null;
    }

    return data.data[0].url;
  }

  const handleSend = async (userInput) => {
    const aiMessagesCount = messages.filter(m => m.sender === "AI").length;
    setMessages((prev) => [...prev, { sender: "Jij", text: userInput }]);

    if (aiMessagesCount >= 10) {
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: "Dat waren mijn 10 vragen. Bedankt voor het gesprek — veel succes met jouw ontwerp!" },
      ]);
      return;
    }

    try {
      const aiReply = await fetchGPTResponse(userInput);
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: aiReply },
      ]);

      const image = await fetchImage(userInput);
      if (image) {
        setImageUrl(image);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: "Er ging iets mis bij het ophalen van een antwoord." },
      ]);
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Chatgedeelte */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <ChatBox messages={messages} />
        <MessageInput onSend={handleSend} />
      </div>

      {/* Afbeelding */}
      <div style={{ flex: 1, padding: "1rem", backgroundColor: "#f5f5f5" }}>
        {imageUrl ? (
          <img src={imageUrl} alt="AI visualisatie" style={{ width: "100%", borderRadius: "8px" }} />
        ) : (
          <p>Er is nog geen afbeelding gegenereerd.</p>
        )}
      </div>
    </div>
  );
}

export default App;
