let API_KEY = 'xai-mASNoFJeAXZgSUvx54ngA6Ga0fIc6EbyxvOdQNXiYJJgNNnjSq5wsYKcJrwqiBwe0wbPOd3WJGApNyrO';

chrome.storage.sync.get(['apiKey'], function(result) {
  API_KEY = result.apiKey;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translateText(request.text)
      .then(translation => sendResponse({translation: translation}))
      .catch(error => sendResponse({error: error.message}));
    return true;  // Indicates that the response is asynchronous
  }
});

async function translateText(text) {
  // Simple cache to avoid repeated API calls for the same text
  const cacheKey = `translation_${text}`;
  const cachedResult = await chrome.storage.local.get([cacheKey]);
  
  if (cachedResult[cacheKey]) {
    return cachedResult[cacheKey];
  }
  
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "grok-2",
      messages: [
        {
          role: "system", 
          content: "You are a Japanese to English translator. Translate the following Japanese text to natural English. Only respond with the translation, no explanations."
        },
        {role: "user", content: text}
      ],
      temperature: 0.3 // Lower temperature for more consistent translations
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const translation = data.choices[0].message.content.trim();
  
  // Cache the result
  chrome.storage.local.set({[cacheKey]: translation});
  
  return translation;
}
