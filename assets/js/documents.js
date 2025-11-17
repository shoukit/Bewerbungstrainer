/**
 * Documents Upload JavaScript
 * Bewerbungstrainer WordPress Plugin
 */

(function($) {
    'use strict';

    /**
     * View document details in modal
     */
    window.bewerbungstrainerViewDocumentDetails = function(documentId) {
        const modal = document.getElementById('bewerbungstrainer-document-modal-' + documentId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    /**
     * Close document modal
     */
    window.bewerbungstrainerCloseDocumentModal = function(documentId) {
        const modal = document.getElementById('bewerbungstrainer-document-modal-' + documentId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Document upload functionality
    $(document).ready(function() {
        const $form = $('#bewerbungstrainer-document-upload-form');
        const $fileInput = $('#bewerbungstrainer-file-input');
        const $fileName = $('.bewerbungstrainer-file-name');
        const $status = $('.bewerbungstrainer-upload-status');
        const $submitButton = $('.bewerbungstrainer-submit-upload');

        // Update file name when file is selected
        $fileInput.on('change', function() {
            const file = this.files[0];
            if (file) {
                $fileName.text(file.name);
            } else {
                $fileName.text('Keine Datei ausgewählt');
            }
        });

        // Handle form submission
        $form.on('submit', function(e) {
            e.preventDefault();

            const file = $fileInput[0].files[0];
            if (!file) {
                showStatus('error', 'Bitte wähle eine Datei aus.');
                return;
            }

            // Validate file type
            if (file.type !== 'application/pdf') {
                showStatus('error', 'Nur PDF-Dateien sind erlaubt.');
                return;
            }

            // Validate file size (10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showStatus('error', 'Datei ist zu groß. Maximal 10MB erlaubt.');
                return;
            }

            // Get document type
            const documentType = $('input[name="document_type"]:checked').val();

            // Prepare form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('document_type', documentType);

            // Show loading status
            showStatus('loading', 'Datei wird hochgeladen und analysiert. Dies kann einige Sekunden dauern...');
            $submitButton.prop('disabled', true);

            // Upload file
            $.ajax({
                url: bewerbungstrainerDocuments.apiUrl + '/documents/upload',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    'X-WP-Nonce': bewerbungstrainerDocuments.nonce
                },
                success: function(response) {
                    if (response.success) {
                        showStatus('success', 'Dokument wurde erfolgreich hochgeladen und analysiert!');

                        // Reset form
                        $form[0].reset();
                        $fileName.text('Keine Datei ausgewählt');

                        // Reload page after 2 seconds to show new document
                        setTimeout(function() {
                            window.location.reload();
                        }, 2000);
                    } else {
                        showStatus('error', 'Fehler beim Hochladen: ' + (response.message || 'Unbekannter Fehler'));
                    }
                },
                error: function(xhr) {
                    let errorMessage = 'Fehler beim Hochladen der Datei.';

                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    } else if (xhr.status === 413) {
                        errorMessage = 'Datei ist zu groß für den Upload.';
                    } else if (xhr.status === 0) {
                        errorMessage = 'Keine Verbindung zum Server. Bitte überprüfe deine Internetverbindung.';
                    }

                    showStatus('error', errorMessage);
                },
                complete: function() {
                    $submitButton.prop('disabled', false);
                }
            });
        });

        /**
         * Show status message
         */
        function showStatus(type, message) {
            $status
                .removeClass('success error loading')
                .addClass(type)
                .html('<p>' + message + '</p>')
                .fadeIn();

            // Auto-hide success/error messages after 5 seconds
            if (type === 'success' || type === 'error') {
                setTimeout(function() {
                    $status.fadeOut();
                }, 5000);
            }
        }
    });

    // Close modal when pressing Escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            $('.bewerbungstrainer-modal').each(function() {
                if ($(this).is(':visible')) {
                    const documentId = $(this).attr('id').replace('bewerbungstrainer-document-modal-', '');
                    bewerbungstrainerCloseDocumentModal(documentId);
                }
            });
        }
    });

})(jQuery);
