import React, { useState } from 'react';
import ChatBox from './components/ChatBox';
import MessageInput from './components/MessageInput';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'AI', text: 'Als jij iets zou mogen ontwerpen voor de wereld van morgen — wat zou je dan maken?' },
  ]);
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const maxQuestions = 10;

  const systemPrompt = `
Je bent een creatieve, nieuwsgierige en toegankelijke AI-interviewer.
Je taak is om studenten te begeleiden naar één concreet ontwerpidee voor de toekomst.
Je stelt gerichte, maar open vragen om hun idee te verkennen en uit te werken.
Je werkt toe naar een duidelijk en concreet visueel voorstel.
`;

  async function openAIRequest(endpoint, payload) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Request failed (${response.status})`);
    }

    return data;
  }

  async function fetchGPTResponse(userInput) {
    const gptMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.sender === 'AI' ? 'assistant' : 'user',
        content: m.text,
      })),
      { role: 'user', content: userInput },
    ];

    const data = await openAIRequest('/api/chat/completions', {
      model: 'gpt-4',
      messages: gptMessages,
      temperature: 0.7,
    });

    return data.choices[0].message.content;
  }

  async function generateImagePromptFromInput(userInput) {
    const data = await openAIRequest('/api/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Je bent een AI die input van studenten omzet in een visuele beschrijving voor een AI-beeldgenerator zoals DALL·E.
          Je gebruikt duidelijke, beschrijvende taal. Je focust op zichtbare elementen zoals vorm, kleur, materiaal, context, omgeving, stijl.
          Je prompt moet geschikt zijn voor visuele representatie, en mag geen abstracte of conceptuele taal bevatten. Houd het bij één concreet idee per prompt.`,
        },
        {
          role: 'user',
          content: `Zet deze ontwerpinput om in een visuele beschrijving voor een AI-beelgenerator:\n"${userInput}"`,
        },
      ],
      temperature: 0.8,
    });

    return data.choices[0].message.content;
  }

  async function fetchImageFromPrompt(prompt) {
    const data = await openAIRequest('/api/images/generations', {
      prompt,
      n: 1,
      size: '512x512',
    });

    return { url: data.data[0].url, prompt };
  }

  const handleSend = async (userInput) => {
    if (isLoading) {
      return;
    }

    const aiMessagesCount = messages.filter((m) => m.sender === 'AI').length;
    setMessages((prev) => [...prev, { sender: 'Jij', text: userInput }]);

    if (aiMessagesCount >= maxQuestions) {
      setMessages((prev) => [...prev, { sender: 'AI', text: 'Dat waren mijn 10 vragen. Veel succes met jouw ontwerp!' }]);
      return;
    }

    setIsLoading(true);

    try {
      const [prompt, aiReply] = await Promise.all([
        generateImagePromptFromInput(userInput),
        fetchGPTResponse(userInput),
      ]);

      setMessages((prev) => [...prev, { sender: 'AI', text: aiReply }]);

      if (prompt) {
        const image = await fetchImageFromPrompt(prompt);
        setImages((prev) => {
          const nextImages = [...prev, image];
          setSelectedImageIndex(nextImages.length - 1);
          return nextImages;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Er ging iets mis met de AI-service.';
      setMessages((prev) => [...prev, { sender: 'AI', text: message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const aiQuestionCount = messages.filter((m) => m.sender === 'AI').length;
  const currentImage = selectedImageIndex !== null ? images[selectedImageIndex] : images[images.length - 1];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
          <strong>Vraag {Math.min(aiQuestionCount, maxQuestions)} van {maxQuestions}</strong>
          <div style={{ height: '6px', background: '#ddd', marginTop: '4px', borderRadius: '3px' }}>
            <div
              style={{
                width: `${(aiQuestionCount / maxQuestions) * 100}%`,
                height: '100%',
                background: '#4caf50',
                borderRadius: '3px',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
        <ChatBox messages={messages} />
        <MessageInput onSend={handleSend} disabled={isLoading} />
      </div>

      <div style={{ flex: 1, padding: '1rem', backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
        {images.length === 0 ? (
          <p>Er is nog geen afbeelding gegenereerd.</p>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <img
                src={currentImage?.url}
                alt="Geselecteerd ontwerp"
                style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#444', marginTop: '0.5rem' }}>
                Prompt: <em>{currentImage?.prompt}</em>
              </p>
            </div>

            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Klik op een ontwerp om het groot te bekijken:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img.url}
                  alt={`Ontwerp ${index + 1}`}
                  onClick={() => setSelectedImageIndex(index)}
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    opacity: selectedImageIndex === index ? 1 : 0.8,
                    border: selectedImageIndex === index ? '2px solid #4caf50' : '1px solid #ccc',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
