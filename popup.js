document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const modeAutoRadio = document.getElementById('modeAuto');
  const modeManualRadio = document.getElementById('modeManual');
  const translationDelayInput = document.getElementById('translationDelay');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'translationMode', 'translationDelay'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    
    if (result.translationMode === 'manual') {
      modeManualRadio.checked = true;
    } else {
      modeAutoRadio.checked = true;
    }
    
    if (result.translationDelay) {
      translationDelayInput.value = result.translationDelay;
    }
  });

  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value;
    const translationMode = modeManualRadio.checked ? 'manual' : 'auto';
    const translationDelay = parseInt(translationDelayInput.value, 10);
    
    chrome.storage.sync.set({
      apiKey: apiKey,
      translationMode: translationMode,
      translationDelay: translationDelay
    }, function() {
      statusElement.textContent = 'Settings saved successfully!';
      setTimeout(() => {
        statusElement.textContent = '';
      }, 3000);
    });
  });
});
