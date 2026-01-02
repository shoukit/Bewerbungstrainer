/**
 * Tips Builder Component
 * Provides a UI for managing tips in WordPress admin scenario pages
 *
 * Usage:
 * 1. Include this script in the admin page
 * 2. Call initTipsBuilder('textarea-id') to initialize
 */

(function() {
    'use strict';

    // Available icons with display names
    const AVAILABLE_ICONS = [
        { value: 'user', label: 'Benutzer', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
        { value: 'target', label: 'Ziel', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>' },
        { value: 'clock', label: 'Uhr', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
        { value: 'mic', label: 'Mikrofon', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>' },
        { value: 'message-square', label: 'Nachricht', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
        { value: 'lightbulb', label: 'Idee', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>' },
        { value: 'brain', label: 'Gehirn', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54"/></svg>' },
        { value: 'check-circle', label: 'Häkchen', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
        { value: 'star', label: 'Stern', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
        { value: 'alert-triangle', label: 'Warnung', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>' },
        { value: 'info', label: 'Info', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>' },
        { value: 'sparkles', label: 'Funken', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>' },
    ];

    // Get SVG for icon
    function getIconSvg(iconName) {
        const icon = AVAILABLE_ICONS.find(i => i.value === iconName);
        return icon ? icon.svg : AVAILABLE_ICONS[0].svg;
    }

    // Parse tips from textarea
    function parseTips(textareaValue) {
        if (!textareaValue || textareaValue.trim() === '') {
            return [];
        }
        try {
            const parsed = JSON.parse(textareaValue);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn('Failed to parse tips JSON:', e);
            return [];
        }
    }

    // Serialize tips to JSON
    function serializeTips(tips) {
        return JSON.stringify(tips, null, 2);
    }

    // Create the icon selector dropdown HTML
    function createIconSelector(selectedIcon, index) {
        let html = '<select class="tips-builder-icon-select" data-index="' + index + '">';
        AVAILABLE_ICONS.forEach(function(icon) {
            const selected = icon.value === selectedIcon ? ' selected' : '';
            html += '<option value="' + icon.value + '"' + selected + '>' + icon.label + '</option>';
        });
        html += '</select>';
        return html;
    }

    // Create a single tip row HTML
    function createTipRow(tip, index) {
        const icon = tip.icon || 'lightbulb';
        const text = tip.text || '';

        return `
            <div class="tips-builder-row" data-index="${index}">
                <div class="tips-builder-row-handle" title="Zum Sortieren ziehen">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                        <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
                    </svg>
                </div>
                <div class="tips-builder-row-icon">
                    <span class="tips-builder-icon-preview">${getIconSvg(icon)}</span>
                    ${createIconSelector(icon, index)}
                </div>
                <div class="tips-builder-row-text">
                    <input type="text" class="tips-builder-text-input" data-index="${index}"
                           value="${text.replace(/"/g, '&quot;')}" placeholder="Tipp-Text eingeben...">
                </div>
                <div class="tips-builder-row-actions">
                    <button type="button" class="tips-builder-delete-btn" data-index="${index}" title="Tipp löschen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    // Initialize the tips builder
    window.initTipsBuilder = function(textareaId) {
        const textarea = document.getElementById(textareaId);
        if (!textarea) {
            console.error('Tips Builder: Textarea not found:', textareaId);
            return;
        }

        // Hide the original textarea
        textarea.style.display = 'none';

        // Create the builder container
        const container = document.createElement('div');
        container.className = 'tips-builder-container';
        container.innerHTML = `
            <div class="tips-builder-header">
                <span class="tips-builder-title">Tipps</span>
                <button type="button" class="tips-builder-add-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
                    </svg>
                    Tipp hinzufügen
                </button>
            </div>
            <div class="tips-builder-list"></div>
            <div class="tips-builder-empty" style="display: none;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                    <path d="M9 18h6"/><path d="M10 22h4"/>
                </svg>
                <p>Noch keine Tipps vorhanden</p>
                <button type="button" class="tips-builder-add-first-btn">Ersten Tipp hinzufügen</button>
            </div>
        `;

        // Insert after textarea
        textarea.parentNode.insertBefore(container, textarea.nextSibling);

        // Get elements
        const list = container.querySelector('.tips-builder-list');
        const emptyState = container.querySelector('.tips-builder-empty');
        const addBtn = container.querySelector('.tips-builder-add-btn');
        const addFirstBtn = container.querySelector('.tips-builder-add-first-btn');

        // Parse initial tips
        let tips = parseTips(textarea.value);

        // Render tips
        function render() {
            if (tips.length === 0) {
                list.style.display = 'none';
                emptyState.style.display = 'flex';
            } else {
                list.style.display = 'block';
                emptyState.style.display = 'none';
                list.innerHTML = tips.map((tip, index) => createTipRow(tip, index)).join('');
                attachRowEventListeners();
            }
            // Update hidden textarea
            textarea.value = serializeTips(tips);
        }

        // Attach event listeners to rows
        function attachRowEventListeners() {
            // Icon select change
            list.querySelectorAll('.tips-builder-icon-select').forEach(function(select) {
                select.addEventListener('change', function() {
                    const index = parseInt(this.dataset.index);
                    tips[index].icon = this.value;
                    // Update preview
                    const preview = this.parentNode.querySelector('.tips-builder-icon-preview');
                    if (preview) {
                        preview.innerHTML = getIconSvg(this.value);
                    }
                    textarea.value = serializeTips(tips);
                });
            });

            // Text input change
            list.querySelectorAll('.tips-builder-text-input').forEach(function(input) {
                input.addEventListener('input', function() {
                    const index = parseInt(this.dataset.index);
                    tips[index].text = this.value;
                    textarea.value = serializeTips(tips);
                });
            });

            // Delete button
            list.querySelectorAll('.tips-builder-delete-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    tips.splice(index, 1);
                    render();
                });
            });
        }

        // Add new tip
        function addTip() {
            tips.push({ icon: 'lightbulb', text: '' });
            render();
            // Focus the new input
            const inputs = list.querySelectorAll('.tips-builder-text-input');
            if (inputs.length > 0) {
                inputs[inputs.length - 1].focus();
            }
        }

        // Event listeners for add buttons
        addBtn.addEventListener('click', addTip);
        addFirstBtn.addEventListener('click', addTip);

        // Make list sortable with drag and drop
        let draggedItem = null;
        let draggedIndex = -1;

        list.addEventListener('dragstart', function(e) {
            const row = e.target.closest('.tips-builder-row');
            if (row) {
                draggedItem = row;
                draggedIndex = parseInt(row.dataset.index);
                row.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        list.addEventListener('dragend', function(e) {
            const row = e.target.closest('.tips-builder-row');
            if (row) {
                row.classList.remove('dragging');
            }
            draggedItem = null;
            draggedIndex = -1;
        });

        list.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientY);
            const row = draggedItem;
            if (row && afterElement == null) {
                list.appendChild(row);
            } else if (row && afterElement) {
                list.insertBefore(row, afterElement);
            }
        });

        list.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem && draggedIndex >= 0) {
                // Reorder tips array based on new DOM order
                const rows = Array.from(list.querySelectorAll('.tips-builder-row'));
                const newTips = rows.map(function(row) {
                    const idx = parseInt(row.dataset.index);
                    return tips[idx];
                });
                tips = newTips;
                render();
            }
        });

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.tips-builder-row:not(.dragging)')];
            return draggableElements.reduce(function(closest, child) {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        // Make rows draggable
        function makeRowsDraggable() {
            list.querySelectorAll('.tips-builder-row').forEach(function(row) {
                row.setAttribute('draggable', 'true');
            });
        }

        // Initial render
        render();
        makeRowsDraggable();

        // Re-make rows draggable after each render
        const originalRender = render;
        render = function() {
            originalRender();
            makeRowsDraggable();
        };

        return {
            getTips: function() { return tips; },
            setTips: function(newTips) { tips = newTips; render(); },
            addTip: addTip
        };
    };

    // CSS styles for the builder
    const styles = `
        .tips-builder-container {
            border: 1px solid #c3c4c7;
            border-radius: 4px;
            background: #fff;
            margin-top: 8px;
        }
        .tips-builder-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #c3c4c7;
            background: #f6f7f7;
        }
        .tips-builder-title {
            font-weight: 600;
            color: #1e1e1e;
        }
        .tips-builder-add-btn,
        .tips-builder-add-first-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: #2271b1;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
        }
        .tips-builder-add-btn:hover,
        .tips-builder-add-first-btn:hover {
            background: #135e96;
        }
        .tips-builder-list {
            padding: 8px;
        }
        .tips-builder-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            margin-bottom: 6px;
            background: #f6f7f7;
            border: 1px solid #dcdcde;
            border-radius: 4px;
            transition: box-shadow 0.2s, background-color 0.2s;
        }
        .tips-builder-row:last-child {
            margin-bottom: 0;
        }
        .tips-builder-row:hover {
            background: #f0f0f1;
        }
        .tips-builder-row.dragging {
            opacity: 0.5;
            background: #e5e5e5;
        }
        .tips-builder-row-handle {
            cursor: grab;
            color: #8c8f94;
            padding: 4px;
            display: flex;
            align-items: center;
        }
        .tips-builder-row-handle:active {
            cursor: grabbing;
        }
        .tips-builder-row-icon {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .tips-builder-icon-preview {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: #fff;
            border: 1px solid #c3c4c7;
            border-radius: 4px;
            color: #2271b1;
        }
        .tips-builder-icon-select {
            width: 120px;
            padding: 4px 8px;
            border: 1px solid #c3c4c7;
            border-radius: 4px;
            background: #fff;
            font-size: 13px;
        }
        .tips-builder-row-text {
            flex: 1;
        }
        .tips-builder-text-input {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #c3c4c7;
            border-radius: 4px;
            font-size: 13px;
        }
        .tips-builder-text-input:focus {
            border-color: #2271b1;
            box-shadow: 0 0 0 1px #2271b1;
            outline: none;
        }
        .tips-builder-row-actions {
            display: flex;
            align-items: center;
        }
        .tips-builder-delete-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: transparent;
            border: 1px solid transparent;
            border-radius: 4px;
            color: #8c8f94;
            cursor: pointer;
            transition: all 0.15s;
        }
        .tips-builder-delete-btn:hover {
            background: #fee;
            border-color: #d63638;
            color: #d63638;
        }
        .tips-builder-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #8c8f94;
            text-align: center;
        }
        .tips-builder-empty svg {
            margin-bottom: 12px;
            opacity: 0.5;
        }
        .tips-builder-empty p {
            margin: 0 0 16px 0;
            font-size: 14px;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
})();
