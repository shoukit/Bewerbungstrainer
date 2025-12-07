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
        this.nonce = this.config.nonce;
    }

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.nonce
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
                'X-WP-Nonce': this.nonce
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
     */
    async generateSimulatorQuestions(sessionId) {
        return this.request(`/simulator/sessions/${sessionId}/questions`, {
            method: 'POST'
        });
    }

    /**
     * Submit answer with audio (using FormData)
     */
    async submitSimulatorAnswer(sessionId, audioBlob, questionIndex, questionText, questionCategory = null) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'answer.webm');
        formData.append('question_index', questionIndex);
        formData.append('question_text', questionText);
        if (questionCategory) {
            formData.append('question_category', questionCategory);
        }

        const url = `${this.apiUrl}/simulator/sessions/${sessionId}/answer`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': this.nonce
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
}

// Export singleton instance
const wordpressAPI = new WordPressAPI();
export default wordpressAPI;
