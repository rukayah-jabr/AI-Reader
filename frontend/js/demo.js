/**
 * AI-Reader Demo Application
 * Interactive demonstration of the accessibility tool
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AIReader
    const aiReader = new AIReader({
        apiUrl: 'http://localhost:5000/api',
        language: 'de',
        autoScan: false, // Manual control for demo
        debug: true,
        
        onImageProcessed: (element, response) => {
            updateImageUI(element, response);
            addLog(`✅ Bild verarbeitet: "${response.alt_text.substring(0, 50)}..."`, 'success');
            updateStats();
        },
        
        onAudioProcessed: (element, response) => {
            updateAudioUI(element, response);
            addLog(`✅ Audio transkribiert: "${response.transcript.substring(0, 50)}..."`, 'success');
            updateStats();
        },
        
        onError: (error) => {
            addLog(`❌ Fehler: ${error.message}`, 'error');
        }
    });

    // DOM Elements
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const languageSelect = document.getElementById('languageSelect');
    const processAllBtn = document.getElementById('processAllBtn');
    const processImagesBtn = document.getElementById('processImagesBtn');
    const processAudioBtn = document.getElementById('processAudioBtn');
    const clearLogBtn = document.getElementById('clearLogBtn');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const logContainer = document.getElementById('logContainer');

    // Navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.section');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const sectionId = tab.dataset.section;
            
            navTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId)?.classList.add('active');
            
            addLog(`📍 Navigation: ${sectionId}`, 'info');
        });
    });

    // Check API Health
    async function checkHealth() {
        try {
            const health = await aiReader.checkHealth();
            if (health.success) {
                statusDot.classList.add('connected');
                statusDot.classList.remove('error');
                statusText.textContent = 'API verbunden';
                addLog('🟢 Backend-Verbindung erfolgreich', 'success');
                
                // Show service availability
                if (health.services) {
                    if (health.services.image_description.available) {
                        addLog(`📸 Bilderkennung verfügbar (${health.services.image_description.provider})`, 'info');
                    }
                    if (health.services.audio_transcription.available) {
                        addLog(`🎵 Audio-Transkription verfügbar (${health.services.audio_transcription.provider})`, 'info');
                    }
                }
            } else {
                throw new Error('API not healthy');
            }
        } catch (error) {
            statusDot.classList.remove('connected');
            statusDot.classList.add('error');
            statusText.textContent = 'Nicht verbunden';
            addLog('🔴 Backend nicht erreichbar. Starten Sie das Backend mit: python app.py', 'error');
        }
    }

    // Process All Button
    processAllBtn.addEventListener('click', async () => {
        processAllBtn.disabled = true;
        processAllBtn.textContent = '⏳ Verarbeite...';
        addLog('🚀 Starte Verarbeitung aller Elemente...', 'info');
        
        try {
            const results = await aiReader.scanAndProcess();
            addLog(`✨ Verarbeitung abgeschlossen: ${results.images.length} Bilder, ${results.audios.length} Audios`, 'success');
        } catch (error) {
            addLog(`❌ Fehler bei der Verarbeitung: ${error.message}`, 'error');
        } finally {
            processAllBtn.disabled = false;
            processAllBtn.textContent = '⚡ Alle verarbeiten';
        }
    });

    // Process Images Button
    processImagesBtn?.addEventListener('click', async () => {
        processImagesBtn.disabled = true;
        addLog('📸 Starte Bildverarbeitung...', 'info');
        
        const images = document.querySelectorAll('#imageGallery img:not([data-ai-processed])');
        for (const img of images) {
            await aiReader.processImage(img);
        }
        
        processImagesBtn.disabled = false;
    });

    // Process Audio Button
    processAudioBtn?.addEventListener('click', async () => {
        processAudioBtn.disabled = true;
        addLog('🎵 Starte Audioverarbeitung...', 'info');
        
        const audios = document.querySelectorAll('#audioGallery audio:not([data-ai-processed])');
        for (const audio of audios) {
            await aiReader.processAudio(audio);
        }
        
        processAudioBtn.disabled = false;
    });

    // Language Select
    languageSelect.addEventListener('change', (e) => {
        aiReader.setConfig({ language: e.target.value });
        addLog(`🌐 Sprache geändert: ${e.target.value === 'de' ? 'Deutsch' : 'English'}`, 'info');
    });

    // File Upload
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        await handleFileUpload(files);
    });
    
    fileInput.addEventListener('change', async (e) => {
        await handleFileUpload(e.target.files);
    });

    async function handleFileUpload(files) {
        const uploadResults = document.getElementById('uploadResults');
        
        for (const file of files) {
            addLog(`📤 Datei hochgeladen: ${file.name}`, 'info');
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'card';
            resultDiv.innerHTML = `
                <h4>${file.type.startsWith('image') ? '🖼️' : '🎵'} ${file.name}</h4>
                <p class="processing">⏳ Wird verarbeitet...</p>
            `;
            uploadResults.appendChild(resultDiv);
            
            try {
                if (file.type.startsWith('image')) {
                    const result = await uploadImage(file);
                    resultDiv.innerHTML = `
                        <h4>🖼️ ${file.name}</h4>
                        <img src="${URL.createObjectURL(file)}" style="max-width: 300px; border-radius: 8px;">
                        <div class="demo-item-alt generated" style="margin-top: 1rem;">
                            <strong>Alt-Text:</strong> ${result.alt_text}
                        </div>
                    `;
                    addLog(`✅ Bild verarbeitet: ${file.name}`, 'success');
                } else if (file.type.startsWith('audio')) {
                    const result = await uploadAudio(file);
                    resultDiv.innerHTML = `
                        <h4>🎵 ${file.name}</h4>
                        <audio controls src="${URL.createObjectURL(file)}" style="width: 100%;"></audio>
                        <div class="transcript generated" style="margin-top: 1rem;">
                            <strong>Transkript:</strong> ${result.transcript}
                        </div>
                    `;
                    addLog(`✅ Audio verarbeitet: ${file.name}`, 'success');
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <h4>❌ ${file.name}</h4>
                    <p style="color: var(--error-color);">Fehler: ${error.message}</p>
                `;
                addLog(`❌ Fehler bei ${file.name}: ${error.message}`, 'error');
            }
        }
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('language', languageSelect.value);
        
        const response = await fetch('http://localhost:5000/api/image/describe', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        return result;
    }

    async function uploadAudio(file) {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('language', languageSelect.value);
        
        const response = await fetch('http://localhost:5000/api/audio/transcribe', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        return result;
    }

    // Update UI Functions
    function updateImageUI(element, response) {
        const container = element.closest('.demo-item');
        if (container) {
            const altDiv = container.querySelector('.demo-item-alt');
            if (altDiv) {
                altDiv.textContent = response.alt_text;
                altDiv.classList.remove('pending');
                altDiv.classList.add('generated');
            }
        }
    }

    function updateAudioUI(element, response) {
        const container = element.closest('.audio-item');
        if (container) {
            const transcriptDiv = container.querySelector('.transcript');
            if (transcriptDiv) {
                transcriptDiv.innerHTML = `<strong>Transkript:</strong> ${response.transcript}`;
                transcriptDiv.classList.remove('pending');
                transcriptDiv.classList.add('generated');
            }
        }
    }

    function updateStats() {
        const totalImages = document.querySelectorAll('img').length;
        const processedImages = document.querySelectorAll('img[data-ai-processed="true"]').length;
        const totalAudio = document.querySelectorAll('audio').length;
        const processedAudio = document.querySelectorAll('audio[data-ai-processed="true"]').length;
        
        document.getElementById('totalImages').textContent = totalImages;
        document.getElementById('processedImages').textContent = processedImages;
        document.getElementById('totalAudio').textContent = totalAudio;
        document.getElementById('processedAudio').textContent = processedAudio;
    }

    // Logging
    function addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('de-DE');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    clearLogBtn.addEventListener('click', () => {
        logContainer.innerHTML = '<div class="log-entry info"><span class="log-timestamp">[System]</span> Log gelöscht</div>';
    });

    // API Docs Link
    document.getElementById('apiDocsLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('http://localhost:5000/api/', '_blank');
    });

    // Initialize
    checkHealth();
    updateStats();
    addLog('🚀 AI-Reader Demo gestartet', 'info');
    
    // Periodic health check
    setInterval(checkHealth, 30000);
});
