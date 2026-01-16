/**
 * AI-Reader - Accessibility Enhancement Library
 * 
 * KI-gestütztes Tool für automatische Accessibility für Bilder und Audios
 * in dynamischen Web Apps.
 * 
 * @version 1.0.0
 * @author Fadime Konuk, Rukayah Jabr, Lulu Wang
 * @license MIT
 */

(function(global, factory) {
    // Universal Module Definition (UMD)
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        global.AIReader = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function() {
    'use strict';

    /**
     * Default configuration
     */
    const DEFAULT_CONFIG = {
        apiUrl: 'http://localhost:5000/api',
        language: 'de',
        autoScan: true,
        scanInterval: 5000, // 5 seconds for dynamic content
        retryAttempts: 3,
        retryDelay: 1000,
        batchSize: 10,
        debug: false,
        
        // Selectors
        imageSelector: 'img:not([data-ai-processed])',
        audioSelector: 'audio:not([data-ai-processed])',
        
        // Callbacks
        onImageProcessed: null,
        onAudioProcessed: null,
        onError: null,
        onBatchComplete: null
    };

    /**
     * AIReader Main Class
     */
    class AIReader {
        constructor(config = {}) {
            this.config = { ...DEFAULT_CONFIG, ...config };
            this.observer = null;
            this.scanTimer = null;
            this.processingQueue = [];
            this.isProcessing = false;
            
            this._log('AIReader initialized with config:', this.config);
            
            if (this.config.autoScan) {
                this._setupMutationObserver();
                this._startAutoScan();
            }
        }

        /**
         * Initialize AIReader and process existing elements
         */
        async init() {
            this._log('Starting initial scan...');
            await this.scanAndProcess();
            return this;
        }

        /**
         * Scan DOM and process all unprocessed images and audios
         */
        async scanAndProcess() {
            const images = this._findUnprocessedImages();
            const audios = this._findUnprocessedAudios();
            
            this._log(`Found ${images.length} images and ${audios.length} audios to process`);
            
            const results = {
                images: [],
                audios: []
            };
            
            // Process images in batches
            if (images.length > 0) {
                results.images = await this._processBatch(images, 'image');
            }
            
            // Process audios
            if (audios.length > 0) {
                results.audios = await this._processBatch(audios, 'audio');
            }
            
            if (this.config.onBatchComplete) {
                this.config.onBatchComplete(results);
            }
            
            return results;
        }

        /**
         * Process a single image element
         */
        async processImage(imgElement) {
            if (!imgElement || imgElement.hasAttribute('data-ai-processed')) {
                return null;
            }
            
            const src = imgElement.src || imgElement.dataset.src;
            if (!src) {
                this._log('Image has no src attribute', imgElement);
                return null;
            }
            
            // Skip if already has meaningful alt text
            const existingAlt = imgElement.alt;
            if (existingAlt && existingAlt.trim() !== '' && !this._isPlaceholderAlt(existingAlt)) {
                this._log('Image already has alt text:', existingAlt);
                imgElement.setAttribute('data-ai-processed', 'skipped');
                return { skipped: true, reason: 'existing-alt' };
            }
            
            try {
                imgElement.setAttribute('data-ai-processing', 'true');
                
                const context = imgElement.dataset.context || 
                               imgElement.closest('figure')?.querySelector('figcaption')?.textContent || '';
                
                const response = await this._callApi('/image/describe-url', {
                    url: src,
                    language: this.config.language,
                    context: context
                });
                
                if (response.success) {
                    // Inject alt text
                    imgElement.alt = response.alt_text;
                    imgElement.setAttribute('data-ai-processed', 'true');
                    imgElement.setAttribute('data-ai-confidence', response.confidence);
                    imgElement.removeAttribute('data-ai-processing');
                    
                    this._log('Alt text generated:', response.alt_text);
                    
                    if (this.config.onImageProcessed) {
                        this.config.onImageProcessed(imgElement, response);
                    }
                    
                    return response;
                } else {
                    throw new Error(response.message || 'API error');
                }
            } catch (error) {
                imgElement.setAttribute('data-ai-processed', 'error');
                imgElement.setAttribute('data-ai-error', error.message);
                imgElement.removeAttribute('data-ai-processing');
                
                this._handleError('Image processing failed', error, imgElement);
                return { error: error.message };
            }
        }

        /**
         * Process a single audio element
         */
        async processAudio(audioElement) {
            if (!audioElement || audioElement.hasAttribute('data-ai-processed')) {
                return null;
            }
            
            const src = audioElement.src || audioElement.querySelector('source')?.src;
            if (!src) {
                this._log('Audio has no src attribute', audioElement);
                return null;
            }
            
            // Check if transcript already exists
            const existingTranscript = audioElement.parentElement?.querySelector('[data-ai-transcript]');
            if (existingTranscript) {
                this._log('Audio already has transcript');
                audioElement.setAttribute('data-ai-processed', 'skipped');
                return { skipped: true, reason: 'existing-transcript' };
            }
            
            try {
                audioElement.setAttribute('data-ai-processing', 'true');
                
                const response = await this._callApi('/audio/transcribe-url', {
                    url: src,
                    language: this.config.language
                });
                
                if (response.success) {
                    // Create and inject transcript element
                    const transcriptElement = this._createTranscriptElement(response);
                    audioElement.parentElement?.insertBefore(
                        transcriptElement,
                        audioElement.nextSibling
                    );
                    
                    // Add aria-describedby
                    const transcriptId = `ai-transcript-${Date.now()}`;
                    transcriptElement.id = transcriptId;
                    audioElement.setAttribute('aria-describedby', transcriptId);
                    
                    audioElement.setAttribute('data-ai-processed', 'true');
                    audioElement.removeAttribute('data-ai-processing');
                    
                    this._log('Transcript generated:', response.transcript.substring(0, 100) + '...');
                    
                    if (this.config.onAudioProcessed) {
                        this.config.onAudioProcessed(audioElement, response);
                    }
                    
                    return response;
                } else {
                    throw new Error(response.message || 'API error');
                }
            } catch (error) {
                audioElement.setAttribute('data-ai-processed', 'error');
                audioElement.setAttribute('data-ai-error', error.message);
                audioElement.removeAttribute('data-ai-processing');
                
                this._handleError('Audio processing failed', error, audioElement);
                return { error: error.message };
            }
        }

        /**
         * Manually trigger processing of an element
         */
        async process(element) {
            if (element.tagName === 'IMG') {
                return this.processImage(element);
            } else if (element.tagName === 'AUDIO') {
                return this.processAudio(element);
            }
            return null;
        }

        /**
         * Stop automatic scanning
         */
        stop() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            if (this.scanTimer) {
                clearInterval(this.scanTimer);
                this.scanTimer = null;
            }
            this._log('AIReader stopped');
        }

        /**
         * Resume automatic scanning
         */
        resume() {
            if (this.config.autoScan) {
                this._setupMutationObserver();
                this._startAutoScan();
            }
            this._log('AIReader resumed');
        }

        /**
         * Update configuration
         */
        setConfig(newConfig) {
            this.config = { ...this.config, ...newConfig };
            this._log('Configuration updated:', this.config);
        }

        /**
         * Check API health
         */
        async checkHealth() {
            try {
                const response = await this._callApi('/health', null, 'GET');
                return response;
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        // ========== Private Methods ==========

        _findUnprocessedImages() {
            return Array.from(document.querySelectorAll(this.config.imageSelector))
                .filter(img => !img.hasAttribute('data-ai-processing'));
        }

        _findUnprocessedAudios() {
            return Array.from(document.querySelectorAll(this.config.audioSelector))
                .filter(audio => !audio.hasAttribute('data-ai-processing'));
        }

        async _processBatch(elements, type) {
            const results = [];
            const batchSize = this.config.batchSize;
            
            for (let i = 0; i < elements.length; i += batchSize) {
                const batch = elements.slice(i, i + batchSize);
                const batchPromises = batch.map(element => {
                    if (type === 'image') {
                        return this.processImage(element);
                    } else {
                        return this.processAudio(element);
                    }
                });
                
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map(r => r.value || r.reason));
            }
            
            return results;
        }

        async _callApi(endpoint, data = null, method = 'POST') {
            const url = `${this.config.apiUrl}${endpoint}`;
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }
            
            let lastError;
            for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
                try {
                    const response = await fetch(url, options);
                    const result = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(result.message || `HTTP ${response.status}`);
                    }
                    
                    return result;
                } catch (error) {
                    lastError = error;
                    this._log(`API call failed (attempt ${attempt}):`, error.message);
                    
                    if (attempt < this.config.retryAttempts) {
                        await this._sleep(this.config.retryDelay * attempt);
                    }
                }
            }
            
            throw lastError;
        }

        _createTranscriptElement(response) {
            const container = document.createElement('details');
            container.className = 'ai-reader-transcript';
            container.setAttribute('data-ai-transcript', 'true');
            
            const summary = document.createElement('summary');
            summary.textContent = this.config.language === 'de' ? 'Transkript anzeigen' : 'Show transcript';
            
            const content = document.createElement('div');
            content.className = 'ai-reader-transcript-content';
            content.textContent = response.transcript;
            
            if (response.duration) {
                const duration = document.createElement('span');
                duration.className = 'ai-reader-transcript-duration';
                duration.textContent = this.config.language === 'de' 
                    ? `Dauer: ${Math.round(response.duration)} Sekunden` 
                    : `Duration: ${Math.round(response.duration)} seconds`;
                content.appendChild(document.createElement('br'));
                content.appendChild(duration);
            }
            
            container.appendChild(summary);
            container.appendChild(content);
            
            return container;
        }

        _isPlaceholderAlt(altText) {
            const placeholders = [
                'image', 'bild', 'photo', 'foto', 'picture',
                'placeholder', 'loading', 'untitled', 'no alt',
                'alt text', 'description'
            ];
            const lowerAlt = altText.toLowerCase().trim();
            return placeholders.some(p => lowerAlt === p || lowerAlt.startsWith(p + ' '));
        }

        _setupMutationObserver() {
            if (this.observer) {
                this.observer.disconnect();
            }
            
            this.observer = new MutationObserver((mutations) => {
                let hasNewContent = false;
                
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.tagName === 'IMG' || node.tagName === 'AUDIO' ||
                                    node.querySelector('img, audio')) {
                                    hasNewContent = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                if (hasNewContent) {
                    this._log('New content detected, scheduling scan...');
                    this._debounceProcess();
                }
            });
            
            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        _startAutoScan() {
            if (this.scanTimer) {
                clearInterval(this.scanTimer);
            }
            
            this.scanTimer = setInterval(() => {
                const images = this._findUnprocessedImages();
                const audios = this._findUnprocessedAudios();
                
                if (images.length > 0 || audios.length > 0) {
                    this._log(`Auto-scan found ${images.length} images and ${audios.length} audios`);
                    this.scanAndProcess();
                }
            }, this.config.scanInterval);
        }

        _debounceProcess() {
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
            }
            this._debounceTimer = setTimeout(() => {
                this.scanAndProcess();
            }, 500);
        }

        _handleError(message, error, element) {
            this._log('Error:', message, error);
            
            if (this.config.onError) {
                this.config.onError({
                    message,
                    error,
                    element
                });
            }
        }

        _log(...args) {
            if (this.config.debug) {
                console.log('[AIReader]', ...args);
            }
        }

        _sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // ========== Styles ==========
    const styles = `
        .ai-reader-transcript {
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: #f9f9f9;
        }
        
        .ai-reader-transcript summary {
            cursor: pointer;
            font-weight: bold;
            color: #333;
        }
        
        .ai-reader-transcript summary:hover {
            color: #0066cc;
        }
        
        .ai-reader-transcript-content {
            margin-top: 10px;
            padding: 10px;
            background-color: white;
            border-radius: 4px;
            line-height: 1.6;
        }
        
        .ai-reader-transcript-duration {
            display: block;
            margin-top: 10px;
            font-size: 0.9em;
            color: #666;
            font-style: italic;
        }
        
        [data-ai-processing="true"] {
            opacity: 0.7;
            position: relative;
        }
        
        [data-ai-processing="true"]::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 24px;
            height: 24px;
            margin: -12px 0 0 -12px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: ai-reader-spin 1s linear infinite;
        }
        
        @keyframes ai-reader-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        [data-ai-processed="error"] {
            outline: 2px solid #ff6b6b;
        }
    `;

    // Inject styles
    if (typeof document !== 'undefined') {
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    return AIReader;
});
