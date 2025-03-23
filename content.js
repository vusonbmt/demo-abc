let lastTranslatedText = '';
let translationOverlay;
let translationTimeout;
const TRANSLATION_DELAY = 500; // ms delay after typing stops before translating

// Create translation overlay
function createTranslationOverlay() {
  translationOverlay = document.createElement('div');
  translationOverlay.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    max-width: 300px;
    display: none;
  `;
  document.body.appendChild(translationOverlay);
}

function showTranslation(text) {
  if (!translationOverlay) {
    createTranslationOverlay();
  }
  translationOverlay.textContent = text;
  translationOverlay.style.display = 'block';
}

function hideTranslation() {
  if (translationOverlay) {
    translationOverlay.style.display = 'none';
  }
}

// Function to check if text is likely Japanese
function isLikelyJapanese(text) {
  // Check for Japanese characters (Hiragana, Katakana, or Kanji)
  return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(text);
}

// Handle text selection translation
document.addEventListener('selectionchange', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText && selectedText !== lastTranslatedText && isLikelyJapanese(selectedText)) {
    lastTranslatedText = selectedText;
    chrome.runtime.sendMessage({action: 'translate', text: selectedText}, response => {
      if (response.translation) {
        showTranslation(response.translation);
      } else if (response.error) {
        showTranslation(`Error: ${response.error}`);
      }
    });
  } else if (!selectedText) {
    hideTranslation();
  }
});

// Handle input fields and textareas
function setupInputListeners() {
  // Find all input fields and textareas
  const inputElements = document.querySelectorAll('input[type="text"], textarea');
  
  inputElements.forEach(element => {
    // Create a floating translation div for each input
    const inputTranslation = document.createElement('div');
    inputTranslation.style.cssText = `
      position: absolute;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 5px;
      border-radius: 3px;
      z-index: 9999;
      font-size: 14px;
      display: none;
    `;
    document.body.appendChild(inputTranslation);
    
    // Position the translation div below the input
    function positionTranslationDiv() {
      const rect = element.getBoundingClientRect();
      inputTranslation.style.left = `${rect.left}px`;
      inputTranslation.style.top = `${rect.bottom + 5}px`;
      inputTranslation.style.width = `${rect.width}px`;
    }
    
    // Translate the input text
    function translateInputText() {
      const text = element.value.trim();
      if (text && isLikelyJapanese(text)) {
        chrome.runtime.sendMessage({action: 'translate', text: text}, response => {
          if (response.translation) {
            inputTranslation.textContent = response.translation;
            inputTranslation.style.display = 'block';
            positionTranslationDiv();
          } else {
            inputTranslation.style.display = 'none';
          }
        });
      } else {
        inputTranslation.style.display = 'none';
      }
    }
    
    // Add event listeners
    element.addEventListener('input', () => {
      // Clear previous timeout
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      // Set new timeout to translate after typing stops
      translationTimeout = setTimeout(translateInputText, TRANSLATION_DELAY);
    });
    
    element.addEventListener('focus', () => {
      if (element.value.trim() && isLikelyJapanese(element.value.trim())) {
        translateInputText();
      }
    });
    
    element.addEventListener('blur', () => {
      inputTranslation.style.display = 'none';
    });
    
    // Handle window resize and scroll
    window.addEventListener('resize', positionTranslationDiv);
    window.addEventListener('scroll', positionTranslationDiv);
  });
}

// Run setup when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupInputListeners);
} else {
  setupInputListeners();
}

// For dynamically added inputs (like in SPAs)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      setupInputListeners();
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
