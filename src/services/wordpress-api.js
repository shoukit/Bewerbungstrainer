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
}

// Export singleton instance
const wordpressAPI = new WordPressAPI();
export default wordpressAPI;
