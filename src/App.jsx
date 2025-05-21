import React, { useState } from 'react';
import ChatBox from './components/ChatBox';
import MessageInput from './components/MessageInput';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'AI', text: 'Als je iets zou mogen ontwerpen voor het Eindhoven van de toekomst — wat zou het dan zijn?' },
  ]);

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

  const handleSend = async (userInput) => {
    try {
      const aiReply = await fetchGPTResponse(userInput);
      setMessages((prev) => [
        ...prev,
        { sender: "Jij", text: userInput },
        { sender: "AI", text: aiReply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: "Er ging iets mis bij het ophalen van een antwoord." },
      ]);
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <ChatBox messages={messages} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}

export default App;
