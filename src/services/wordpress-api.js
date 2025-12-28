/**
 * WordPress REST API Service
 *
 * Handles all communication with WordPress REST API endpoints
 */

class WordPressAPI {
    constructor() {
        // Get config from WordPress localized script
        this.config = window.bewerbungstrainerConfig || {
            apiUrl: '/wp-json/bewerbungstrainer/v1',
            nonce: '',
            currentUser: { id: 0, name: '', firstName: '' },
            uploadsUrl: '',
            elevenlabsAgentId: '',
            elevenlabsApiKey: '',
            geminiApiKey: ''
        };

        this.apiUrl = this.config.apiUrl;
        // Note: nonce is now read dynamically via getNonce() to support login/logout
    }

    /**
     * Get current nonce (always read from window.bewerbungstrainerConfig to support dynamic updates after login)
     * IMPORTANT: Never cache the nonce - always read fresh from the global config
     */
    getNonce() {
        // Always read directly from the global config - this is updated after login
        const nonce = window.bewerbungstrainerConfig?.nonce || '';
        if (!nonce) {
            console.warn('[WordPressAPI] No nonce available - user may not be logged in');
        }
        return nonce;
    }

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;

        // Always get fresh nonce at request time
        const currentNonce = this.getNonce();

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': currentNonce
            },
            credentials: 'same-origin'
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, mergedOptions);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * Get current user info
     */
    async getUserInfo() {
        return this.request('/user/info', {
            method: 'GET'
        });
    }

    /**
     * Get plugin settings
     */
    async getSettings() {
        return this.request('/settings', {
            method: 'GET'
        });
    }

    /**
     * Create a new training session
     */
    async createSession(sessionData) {
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    }

    /**
     * Get all sessions for current user
     */
    async getSessions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/sessions?${queryString}` : '/sessions';

        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * Get specific session by ID
     */
    async getSession(sessionId) {
        return this.request(`/sessions/${sessionId}`, {
            method: 'GET'
        });
    }

    /**
     * Update session
     */
    async updateSession(sessionId, updateData) {
        return this.request(`/sessions/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    /**
     * Delete session
     */
    async deleteSession(sessionId) {
        return this.request(`/sessions/${sessionId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Save audio from ElevenLabs
     */
    async saveAudioFromElevenLabs(conversationId, sessionId) {
        return this.request('/audio/save-elevenlabs', {
            method: 'POST',
            body: JSON.stringify({
                conversation_id: conversationId,
                session_id: sessionId
            })
        });
    }

    /**
     * Upload audio (base64)
     */
    async uploadAudio(audioData, sessionId) {
        return this.request('/audio/upload', {
            method: 'POST',
            body: JSON.stringify({
                audio_data: audioData,
                session_id: sessionId
            })
        });
    }

    /**
     * Get current user from config
     */
    getCurrentUser() {
        return this.config.currentUser;
    }

    /**
     * Get ElevenLabs Agent ID
     */
    getElevenLabsAgentId() {
        return this.config.elevenlabsAgentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    }

    /**
     * Get ElevenLabs API Key
     */
    getElevenLabsApiKey() {
        return this.config.elevenlabsApiKey || import.meta.env.VITE_ELEVENLABS_API_KEY;
    }

    /**
     * Get Gemini API Key
     */
    getGeminiApiKey() {
        return this.config.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
    }

    /**
     * Check if running in WordPress environment
     */
    isWordPress() {
        return typeof window.bewerbungstrainerConfig !== 'undefined';
    }

    /**
     * ===== Video Training API Methods =====
     */

    /**
     * Generate interview questions
     */
    async generateQuestions(data) {
        return this.request('/video-training/generate-questions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Create video training session
     */
    async createVideoTraining(data) {
        return this.request('/video-training', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Upload video for training session
     */
    async uploadVideo(trainingId, videoFile, timeline) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('timeline', JSON.stringify(timeline));

        return this.request(`/video-training/${trainingId}/upload`, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': this.getNonce()
            },
            body: formData
        });
    }

    /**
     * Trigger video analysis
     */
    async analyzeVideoTraining(trainingId) {
        return this.request(`/video-training/${trainingId}/analyze`, {
            method: 'POST'
        });
    }

    /**
     * Get video training session
     */
    async getVideoTraining(trainingId) {
        return this.request(`/video-training/${trainingId}`, {
            method: 'GET'
        });
    }

    /**
     * Get all video trainings for current user
     */
    async getVideoTrainings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/video-training?${queryString}` : '/video-training';

        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * Delete video training
     */
    async deleteVideoTraining(trainingId) {
        return this.request(`/video-training/${trainingId}`, {
            method: 'DELETE'
        });
    }

    // ===== Skill Simulator API Methods =====

    /**
     * Get all simulator scenarios
     */
    async getSimulatorScenarios(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/simulator/scenarios?${queryString}` : '/simulator/scenarios';

        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * Get specific simulator scenario
     */
    async getSimulatorScenario(scenarioId) {
        return this.request(`/simulator/scenarios/${scenarioId}`, {
            method: 'GET'
        });
    }

    /**
     * Create simulator session
     */
    async createSimulatorSession(data) {
        return this.request('/simulator/sessions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Generate questions for simulator session
     * Includes retry logic for transient failures
     */
    async generateSimulatorQuestions(sessionId, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.request(`/simulator/sessions/${sessionId}/questions`, {
                    method: 'POST'
                });
                return result;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ [SimulatorAPI] Question generation failed on attempt ${attempt}:`, error.message);

                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff: 1s, 2s, 4s)
                    const waitTime = Math.pow(2, attempt - 1) * 1000;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }

        // All retries failed
        console.error(`❌ [SimulatorAPI] Question generation failed after ${maxRetries} attempts`);
        throw lastError;
    }

    /**
     * Update session with preloaded questions (for repeat sessions)
     */
    async updateSimulatorSessionQuestions(sessionId, questions) {
        return this.request(`/simulator/sessions/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify({ questions_json: questions })
        });
    }

    /**
     * Submit answer with audio (using FormData)
     */
    async submitSimulatorAnswer(sessionId, audioBlob, questionIndex, questionText, questionCategory = null, audioDuration = null) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'answer.webm');
        formData.append('question_index', questionIndex);
        formData.append('question_text', questionText);
        if (questionCategory) {
            formData.append('question_category', questionCategory);
        }
        if (audioDuration !== null && audioDuration > 0) {
            formData.append('audio_duration', audioDuration);
        }

        const url = `${this.apiUrl}/simulator/sessions/${sessionId}/answer`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': this.getNonce()
            },
            credentials: 'same-origin',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Submit answer with base64 audio (alternative method)
     */
    async submitSimulatorAnswerBase64(sessionId, audioBase64, mimeType, questionIndex, questionText, questionCategory = null) {
        return this.request(`/simulator/sessions/${sessionId}/answer`, {
            method: 'POST',
            body: JSON.stringify({
                audio_base64: audioBase64,
                audio_mime_type: mimeType,
                question_index: questionIndex,
                question_text: questionText,
                question_category: questionCategory
            })
        });
    }

    /**
     * Update simulator session
     */
    async updateSimulatorSession(sessionId, data) {
        return this.request(`/simulator/sessions/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Get simulator session
     */
    async getSimulatorSession(sessionId) {
        return this.request(`/simulator/sessions/${sessionId}`, {
            method: 'GET'
        });
    }

    /**
     * Get all simulator sessions for user
     */
    async getSimulatorSessions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/simulator/sessions?${queryString}` : '/simulator/sessions';

        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * Delete simulator session
     */
    async deleteSimulatorSession(sessionId) {
        return this.request(`/simulator/sessions/${sessionId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Generate next turn for SIMULATION mode
     * Generates the next AI response based on conversation history (from database)
     */
    async generateNextTurn(sessionId) {
        return this.request(`/simulator/sessions/${sessionId}/next-turn`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    }

    /**
     * Get simulator session answers
     */
    async getSimulatorSessionAnswers(sessionId) {
        return this.request(`/simulator/sessions/${sessionId}/answers`, {
            method: 'GET'
        });
    }

    /**
     * Complete simulator session and get summary
     */
    async completeSimulatorSession(sessionId) {
        return this.request(`/simulator/sessions/${sessionId}/complete`, {
            method: 'POST'
        });
    }

    // ===== Rhetorik-Gym Game API Methods =====

    /**
     * Get all scenario templates
     */
    async getScenarioTemplates(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/game/templates?${queryString}` : '/game/templates';

        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * Get specific scenario template
     */
    async getScenarioTemplate(templateId) {
        return this.request(`/game/templates/${templateId}`, {
            method: 'GET'
        });
    }

    /**
     * Get scenario categories
     */
    async getScenarioCategories() {
        return this.request('/game/templates/categories', {
            method: 'GET'
        });
    }

    /**
     * Create game session
     */
    async createGameSession(data) {
        return this.request('/game/sessions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Get user's game sessions
     */
    async getGameSessions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/game/sessions?${queryString}` : '/game/sessions';

        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * Get specific game session
     */
    async getGameSession(sessionId) {
        return this.request(`/game/sessions/${sessionId}`, {
            method: 'GET'
        });
    }

    /**
     * Update game session
     */
    async updateGameSession(sessionId, data) {
        return this.request(`/game/sessions/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete game session
     */
    async deleteGameSession(sessionId) {
        return this.request(`/game/sessions/${sessionId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get user's game stats
     */
    async getGameStats() {
        return this.request('/game/stats', {
            method: 'GET'
        });
    }

    /**
     * Get leaderboard
     */
    async getGameLeaderboard(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/game/leaderboard?${queryString}` : '/game/leaderboard';

        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * Get user's highscore
     */
    async getGameHighscore(gameType = null) {
        const params = gameType ? `?game_type=${gameType}` : '';
        return this.request(`/game/highscore${params}`, {
            method: 'GET'
        });
    }

    // ===== Admin Management API Methods =====

    /**
     * Check if current user is admin
     */
    async checkAdminStatus() {
        return this.request('/admin/check', {
            method: 'GET'
        });
    }

    /**
     * Get all roleplay scenarios (admin)
     */
    async adminGetRoleplayScenarios() {
        return this.request('/admin/roleplays', {
            method: 'GET'
        });
    }

    /**
     * Create roleplay scenario (admin)
     */
    async adminCreateRoleplayScenario(data) {
        return this.request('/admin/roleplays', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update roleplay scenario (admin)
     */
    async adminUpdateRoleplayScenario(id, data) {
        return this.request(`/admin/roleplays/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete roleplay scenario (admin)
     */
    async adminDeleteRoleplayScenario(id) {
        return this.request(`/admin/roleplays/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get all partners (admin)
     */
    async adminGetPartners() {
        return this.request('/admin/partners', {
            method: 'GET'
        });
    }

    /**
     * Create partner (admin)
     */
    async adminCreatePartner(data) {
        return this.request('/admin/partners', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update partner (admin)
     */
    async adminUpdatePartner(id, data) {
        return this.request(`/admin/partners/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete partner (admin)
     */
    async adminDeletePartner(id) {
        return this.request(`/admin/partners/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get all simulator scenarios (admin)
     */
    async adminGetSimulatorScenarios() {
        return this.request('/admin/simulator-scenarios', {
            method: 'GET'
        });
    }

    /**
     * Get all video training scenarios (admin)
     */
    async adminGetVideoTrainingScenarios() {
        return this.request('/admin/video-training-scenarios', {
            method: 'GET'
        });
    }

    // ===== Logging API Methods =====

    /**
     * Log a prompt to the server-side prompts.log file
     *
     * @param {string} scenario - Scenario name (e.g., "ELEVENLABS_LIVE_SESSION", "GEMINI_FEEDBACK")
     * @param {string} description - Human-readable description
     * @param {string} prompt - The prompt text
     * @param {object} metadata - Additional metadata (optional)
     * @param {string} response - Response from AI (optional, for logging both prompt and response)
     * @param {boolean} isError - Whether the response is an error (optional)
     */
    async logPrompt(scenario, description, prompt, metadata = {}, response = null, isError = false) {
        try {
            const payload = {
                scenario,
                description,
                prompt,
                metadata
            };

            if (response) {
                payload.response = response;
                payload.is_error = isError;
            }

            await this.request('/log-prompt', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch (error) {
            // Don't throw - logging should not break the main flow
            console.warn(`⚠️ [WordPressAPI] Failed to log prompt: ${error.message}`);
        }
    }

    // ===== Categories API Methods =====

    /**
     * Get all categories from centralized category system
     * Categories are used for filtering scenarios across all modules
     * @returns {Promise<Array>} Array of category objects
     */
    async getCategories() {
        try {
            const response = await this.request('/categories', {
                method: 'GET'
            });

            if (response.success && response.data?.categories) {
                return response.data.categories;
            }

            console.warn('[WordPressAPI] Unexpected categories response format');
            return [];
        } catch (error) {
            console.error('[WordPressAPI] Failed to fetch categories:', error);
            return [];
        }
    }

    /**
     * Get a single category by ID
     * @param {number} categoryId - Category ID
     * @returns {Promise<object|null>} Category object or null
     */
    async getCategory(categoryId) {
        try {
            const response = await this.request(`/categories/${categoryId}`, {
                method: 'GET'
            });

            if (response.success && response.data?.category) {
                return response.data.category;
            }

            return null;
        } catch (error) {
            console.error('[WordPressAPI] Failed to fetch category:', error);
            return null;
        }
    }

    /**
     * Get usage limits for current user
     *
     * @param {string} demoCode - Optional demo code for demo users
     * @returns {Promise<object>} Usage limits data
     */
    async getUsageLimits(demoCode = null) {
        try {
            const queryParams = demoCode ? `?demo_code=${encodeURIComponent(demoCode)}` : '';
            const response = await this.request(`/usage-limits${queryParams}`, {
                method: 'GET'
            });

            return response.data;
        } catch (error) {
            console.error('❌ [WordPressAPI] Failed to get usage limits:', error);
            throw error;
        }
    }

    // ===== Decision Board API Methods =====

    /**
     * Get all decisions for current user
     *
     * @returns {Promise<object>} Response with decisions array
     */
    async getDecisions() {
        try {
            const response = await this.request('/decisions', {
                method: 'GET'
            });

            // Return full response for consistency with SessionHistory
            return response;
        } catch (error) {
            console.error('❌ [WordPressAPI] Failed to get decisions:', error);
            return { success: false, data: { decisions: [] } };
        }
    }

    /**
     * Get a specific decision by ID
     *
     * @param {number} decisionId - Decision ID
     * @returns {Promise<object|null>} Decision object or null
     */
    async getDecision(decisionId) {
        try {
            const response = await this.request(`/decisions/${decisionId}`, {
                method: 'GET'
            });

            if (response.success && response.data?.decision) {
                return response.data.decision;
            }

            return null;
        } catch (error) {
            console.error('❌ [WordPressAPI] Failed to get decision:', error);
            return null;
        }
    }

    /**
     * Create a new decision
     *
     * @param {object} data - Decision data (topic, context, pros, cons, etc.)
     * @returns {Promise<object>} Created decision object
     */
    async createDecision(data) {
        const response = await this.request('/decisions', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success && response.data?.decision) {
            return response.data.decision;
        }

        throw new Error(response.message || 'Fehler beim Erstellen der Entscheidung');
    }

    /**
     * Update a decision
     *
     * @param {number} decisionId - Decision ID
     * @param {object} data - Data to update
     * @returns {Promise<object>} Updated decision object
     */
    async updateDecision(decisionId, data) {
        const response = await this.request(`/decisions/${decisionId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (response.success && response.data?.decision) {
            return response.data.decision;
        }

        throw new Error(response.message || 'Fehler beim Aktualisieren der Entscheidung');
    }

    /**
     * Delete a decision
     *
     * @param {number} decisionId - Decision ID
     * @returns {Promise<boolean>} True on success
     */
    async deleteDecision(decisionId) {
        const response = await this.request(`/decisions/${decisionId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            return true;
        }

        throw new Error(response.message || 'Fehler beim Löschen der Entscheidung');
    }

    // ===== Ikigai Career Pathfinder API Methods =====

    /**
     * Get all ikigai sessions for current user
     *
     * @returns {Promise<object>} Response with ikigais array
     */
    async getIkigais() {
        try {
            const response = await this.request('/ikigai', {
                method: 'GET'
            });

            // Return full response for consistency
            return response;
        } catch (error) {
            console.error('[WordPressAPI] Failed to get ikigais:', error);
            return { success: false, data: { ikigais: [] } };
        }
    }

    /**
     * Get a specific ikigai session by ID
     *
     * @param {number} ikigaiId - Ikigai ID
     * @returns {Promise<object|null>} Ikigai object or null
     */
    async getIkigai(ikigaiId) {
        try {
            const response = await this.request(`/ikigai/${ikigaiId}`, {
                method: 'GET'
            });

            if (response.success && response.data?.ikigai) {
                return response.data.ikigai;
            }

            return null;
        } catch (error) {
            console.error('[WordPressAPI] Failed to get ikigai:', error);
            return null;
        }
    }

    /**
     * Get current (in-progress) ikigai session
     *
     * @returns {Promise<object|null>} Ikigai object or null
     */
    async getCurrentIkigai() {
        try {
            const response = await this.request('/ikigai/current', {
                method: 'GET'
            });

            if (response.success && response.data?.ikigai) {
                return response.data.ikigai;
            }

            return null;
        } catch (error) {
            console.error('[WordPressAPI] Failed to get current ikigai:', error);
            return null;
        }
    }

    /**
     * Create a new ikigai session
     *
     * @returns {Promise<object>} Created ikigai object
     */
    async createIkigai() {
        const response = await this.request('/ikigai', {
            method: 'POST',
            body: JSON.stringify({})
        });

        if (response.success && response.data?.ikigai) {
            return response.data.ikigai;
        }

        throw new Error(response.message || 'Fehler beim Erstellen der Ikigai-Analyse');
    }

    /**
     * Update an ikigai session
     *
     * @param {number} ikigaiId - Ikigai ID
     * @param {object} data - Data to update
     * @returns {Promise<object>} Updated ikigai object
     */
    async updateIkigai(ikigaiId, data) {
        const response = await this.request(`/ikigai/${ikigaiId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (response.success && response.data?.ikigai) {
            return response.data.ikigai;
        }

        throw new Error(response.message || 'Fehler beim Aktualisieren der Ikigai-Analyse');
    }

    /**
     * Delete an ikigai session
     *
     * @param {number} ikigaiId - Ikigai ID
     * @returns {Promise<boolean>} True on success
     */
    async deleteIkigai(ikigaiId) {
        const response = await this.request(`/ikigai/${ikigaiId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            return true;
        }

        throw new Error(response.message || 'Fehler beim Löschen der Ikigai-Analyse');
    }

    /**
     * Extract keywords from user input for a dimension
     *
     * @param {string} dimension - Dimension key (love, talent, need, market)
     * @param {string} userInput - User's text input
     * @returns {Promise<object>} Object with keywords array
     */
    async extractIkigaiKeywords(dimension, userInput) {
        const response = await this.request('/ikigai/extract', {
            method: 'POST',
            body: JSON.stringify({
                dimension,
                user_input: userInput
            })
        });

        if (response.success && response.data?.keywords) {
            return { keywords: response.data.keywords };
        }

        throw new Error(response.message || 'Fehler beim Extrahieren der Keywords');
    }

    /**
     * Synthesize career paths from all dimensions
     *
     * @param {object} tags - Object with love_tags, talent_tags, need_tags, market_tags arrays
     * @returns {Promise<object>} Object with summary and paths array
     */
    async synthesizeIkigaiPaths(tags) {
        const response = await this.request('/ikigai/synthesize', {
            method: 'POST',
            body: JSON.stringify(tags)
        });

        if (response.success && response.data) {
            return {
                summary: response.data.summary,
                paths: response.data.paths
            };
        }

        throw new Error(response.message || 'Fehler beim Erstellen der Karrierepfade');
    }

    // ===== Audio Transcription API Methods =====

    /**
     * Transcribe audio using Whisper API
     *
     * @param {string} audioBase64 - Base64 encoded audio data (without data URI prefix)
     * @param {string} mimeType - MIME type of the audio (default: audio/webm)
     * @returns {Promise<object>} Transcription result with transcript and language
     */
    async transcribeAudio(audioBase64, mimeType = 'audio/webm') {
        try {
            const response = await this.request('/audio/transcribe', {
                method: 'POST',
                body: JSON.stringify({
                    audio_base64: audioBase64,
                    mime_type: mimeType,
                })
            });

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error(response.message || 'Transkription fehlgeschlagen');
        } catch (error) {
            console.error('❌ [WordPressAPI] Failed to transcribe audio:', error);
            throw error;
        }
    }

    // ===== Dashboard / Recent Activities API Methods =====

    /**
     * Get recent activities across all modules for the dashboard
     * Combines sessions from roleplay, simulator, video, briefings, games, ikigai, decisions
     *
     * @param {number} limit - Maximum number of activities to return (default: 6)
     * @returns {Promise<Array>} Array of recent activity objects
     */
    async getRecentActivities(limit = 6) {
        try {
            const activities = [];

            // Fetch from all modules in parallel
            const [sessions, simulatorSessions, videoSessions, gameSessions, briefings, ikigais, decisions] = await Promise.allSettled([
                this.getSessions({ limit: 3 }),
                this.getSimulatorSessions({ limit: 3 }),
                this.getVideoTrainings({ limit: 3 }),
                this.getGameSessions({ limit: 3 }),
                this.request('/smartbriefing/briefings?limit=3', { method: 'GET' }),
                this.getIkigais(),
                this.getDecisions(),
            ]);

            // Process roleplay sessions
            if (sessions.status === 'fulfilled' && Array.isArray(sessions.value)) {
                sessions.value.forEach(session => {
                    activities.push({
                        id: `roleplay_${session.id}`,
                        type: 'roleplay',
                        title: session.position || 'Live-Simulation',
                        created_at: session.created_at,
                        score: session.score,
                    });
                });
            }

            // Process simulator sessions
            if (simulatorSessions.status === 'fulfilled' && simulatorSessions.value?.data?.sessions) {
                simulatorSessions.value.data.sessions.forEach(session => {
                    activities.push({
                        id: `simulator_${session.id}`,
                        type: 'simulator',
                        title: session.scenario_title || 'Szenario-Training',
                        created_at: session.created_at,
                        score: session.overall_score,
                    });
                });
            } else if (simulatorSessions.status === 'fulfilled' && Array.isArray(simulatorSessions.value)) {
                simulatorSessions.value.forEach(session => {
                    activities.push({
                        id: `simulator_${session.id}`,
                        type: 'simulator',
                        title: session.scenario_title || 'Szenario-Training',
                        created_at: session.created_at,
                        score: session.overall_score,
                    });
                });
            }

            // Process video sessions
            if (videoSessions.status === 'fulfilled' && videoSessions.value?.data?.sessions) {
                videoSessions.value.data.sessions.forEach(session => {
                    activities.push({
                        id: `video_${session.id}`,
                        type: 'video',
                        title: session.scenario_title || 'Wirkungs-Analyse',
                        created_at: session.created_at,
                        score: session.overall_score,
                    });
                });
            } else if (videoSessions.status === 'fulfilled' && Array.isArray(videoSessions.value)) {
                videoSessions.value.forEach(session => {
                    activities.push({
                        id: `video_${session.id}`,
                        type: 'video',
                        title: session.scenario_title || 'Wirkungs-Analyse',
                        created_at: session.created_at,
                        score: session.overall_score,
                    });
                });
            }

            // Process game sessions
            if (gameSessions.status === 'fulfilled' && gameSessions.value?.data?.sessions) {
                gameSessions.value.data.sessions.forEach(session => {
                    activities.push({
                        id: `game_${session.id}`,
                        type: 'game',
                        title: session.topic || 'Rhetorik-Gym',
                        created_at: session.created_at,
                        score: session.score,
                    });
                });
            } else if (gameSessions.status === 'fulfilled' && Array.isArray(gameSessions.value)) {
                gameSessions.value.forEach(session => {
                    activities.push({
                        id: `game_${session.id}`,
                        type: 'game',
                        title: session.topic || 'Rhetorik-Gym',
                        created_at: session.created_at,
                        score: session.score,
                    });
                });
            }

            // Process Smart Briefings
            if (briefings.status === 'fulfilled') {
                const briefingData = briefings.value?.data?.briefings || briefings.value?.briefings || [];
                briefingData.slice(0, 3).forEach(briefing => {
                    activities.push({
                        id: `briefing_${briefing.id}`,
                        type: 'briefing',
                        title: briefing.title || 'Smart Briefing',
                        created_at: briefing.created_at,
                    });
                });
            }

            // Process Ikigai sessions
            if (ikigais.status === 'fulfilled') {
                const ikigaiData = ikigais.value?.data?.ikigais || [];
                ikigaiData.slice(0, 3).forEach(ikigai => {
                    activities.push({
                        id: `ikigai_${ikigai.id}`,
                        type: 'ikigai',
                        title: 'Ikigai-Analyse',
                        created_at: ikigai.created_at,
                    });
                });
            }

            // Process Decision Board entries
            if (decisions.status === 'fulfilled') {
                const decisionData = decisions.value?.data?.decisions || [];
                decisionData.slice(0, 3).forEach(decision => {
                    activities.push({
                        id: `decision_${decision.id}`,
                        type: 'decision',
                        title: decision.topic || 'Entscheidung',
                        created_at: decision.created_at,
                    });
                });
            }

            // Helper to parse MySQL/WordPress date format (stored in local server time)
            const parseDate = (dateString) => {
                if (!dateString) return new Date(0);
                // Handle MySQL format "YYYY-MM-DD HH:MM:SS" - local time, not UTC
                if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
                    return new Date(dateString.replace(' ', 'T'));
                }
                return new Date(dateString);
            };

            // Sort by created_at descending and limit
            activities.sort((a, b) => parseDate(b.created_at) - parseDate(a.created_at));

            return activities.slice(0, limit);
        } catch (error) {
            console.error('[WordPressAPI] Failed to get recent activities:', error);
            return [];
        }
    }
}

// Export singleton instance
const wordpressAPI = new WordPressAPI();
export default wordpressAPI;

/**
 * Get current WordPress REST API nonce
 * Always reads fresh from window.bewerbungstrainerConfig to support login/logout
 * Use this for any direct fetch calls outside of WordPressAPI
 */
export function getWPNonce() {
    return window.bewerbungstrainerConfig?.nonce || '';
}

/**
 * Get WordPress API base URL
 */
export function getWPApiUrl() {
    return window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1';
}

/**
 * Get recent activities for the dashboard
 * Convenience export for QuadDashboard component
 */
export function getRecentActivities(limit = 5) {
    return wordpressAPI.getRecentActivities(limit);
}
