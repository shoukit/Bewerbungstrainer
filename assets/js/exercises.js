/**
 * Exercises List JavaScript
 * Bewerbungstrainer WordPress Plugin
 */

(function($) {
    'use strict';

    // Audio player instance
    let currentAudio = null;

    /**
     * View exercise details in modal
     */
    window.bewerbungstrainerViewDetails = function(sessionId) {
        const modal = document.getElementById('bewerbungstrainer-modal-' + sessionId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    /**
     * Close modal
     */
    window.bewerbungstrainerCloseModal = function(sessionId) {
        const modal = document.getElementById('bewerbungstrainer-modal-' + sessionId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        // Stop audio if playing
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
    };

    /**
     * Play audio
     */
    window.bewerbungstrainerPlayAudio = function(audioUrl, button) {
        // Stop previous audio
        if (currentAudio) {
            currentAudio.pause();
        }

        // Create new audio instance
        currentAudio = new Audio(audioUrl);

        // Update button state
        const originalHTML = button.innerHTML;
        button.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> Wird abgespielt...';
        button.disabled = true;

        // Play audio
        currentAudio.play();

        // Handle audio end
        currentAudio.addEventListener('ended', function() {
            button.innerHTML = originalHTML;
            button.disabled = false;
            currentAudio = null;
        });

        // Handle audio error
        currentAudio.addEventListener('error', function(e) {
            button.innerHTML = originalHTML;
            button.disabled = false;
            alert('Fehler beim Abspielen der Audio-Datei.');
            currentAudio = null;
        });
    };

    // Close modal when pressing Escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            $('.bewerbungstrainer-modal').each(function() {
                if ($(this).is(':visible')) {
                    const sessionId = $(this).attr('id').replace('bewerbungstrainer-modal-', '');
                    bewerbungstrainerCloseModal(sessionId);
                }
            });
        }
    });

})(jQuery);
