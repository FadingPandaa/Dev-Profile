document.addEventListener('DOMContentLoaded', () => {
    // CONTACT FORM HANDLING
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileUpload');
    const progress = document.getElementById('uploadProgress');
    const fileName = document.getElementById('fileName');
    const uploadPercentEl = document.getElementById('uploadPercent');

    const isStaticSite = !window.location.href.includes('php');
    if (isStaticSite) {
        const navLinks = document.querySelectorAll('.nav-link-item');
        navLinks.forEach(link => {
            const target = link.getAttribute('href');
            if (target && target === window.location.pathname.split('/').pop()) {
                link.classList.add('active');
            }
        });
    }

    // Handle form submission with simulated upload.
    if (contactForm && successMessage) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            markActionTriggered(submitBtn);

            try {
                // Attempt the real submission first so a failed request redirects to the error page.
                const formData = new FormData(contactForm);
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    throw new Error('Submission failed');
                }

                // If an upload is in progress, wait for it to finish before showing success.
                if (uploadTimer) {
                    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'WAITING...'; }
                    const waitInterval = setInterval(() => {
                        if (!uploadTimer) {
                            clearInterval(waitInterval);
                            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'SUBMIT'; }
                            contactForm.style.display = 'none';
                            successMessage.style.display = 'block';
                        }
                    }, 200);
                } else {
                    contactForm.style.display = 'none';
                    successMessage.style.display = 'block';
                }
            } catch (error) {
                window.location.href = 'error.html';
            }
        });
    }

    // Typewriter effect for home page title
    const typewriterElement = document.getElementById('typewriter-effect');
    if (typewriterElement) {
        const fullText = typewriterElement.textContent.trim();
        typewriterElement.textContent = '';
        let currentIndex = 0;
        const typeSpeed = 85;

        function typeCharacter() {
            if (currentIndex < fullText.length) {
                typewriterElement.textContent += fullText.charAt(currentIndex);
                currentIndex += 1;
                setTimeout(typeCharacter, typeSpeed);
            }
        }

        setTimeout(typeCharacter, 800);
    }

    // FILE UPLOAD HANDLING
    if (dropZone && fileInput) {
        // Visual feedback classes for drag state.
        function setDragOver(on) {
            if (on) dropZone.classList.add('drag-over'); else dropZone.classList.remove('drag-over');
        }

        // Drag and drop events
        dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); setDragOver(true); });
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; setDragOver(true); });
        dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); setDragOver(false); });

        // Handles file drops.
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                // try direct assignment; fallback to DataTransfer
                try { fileInput.files = e.dataTransfer.files; } catch (err) {
                    const dt = new DataTransfer();
                    Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
                    fileInput.files = dt.files;
                }
                handleFile();
            }
        });

        // Click anywhere in the drop zone to open file picker.
        dropZone.addEventListener('click', (e) => {
            markActionTriggered(dropZone);
            if (fileInput) fileInput.click();
        });

        // Support file selection via input as well.
        fileInput.addEventListener('change', handleFile);
    }

    // Resets the upload UI state.
    function resetUploadUI(preserveFiles = false) {
        if (progress) progress.style.width = '0%';
        if (uploadPercentEl) uploadPercentEl.textContent = '0%';
        if (fileName && !preserveFiles) fileName.innerHTML = '';
        uploadCompleted = false;
        if (uploadTimer) { clearInterval(uploadTimer); uploadTimer = null; }
    }

    // Handles file selection and starts the simulated upload.
    function handleFile() {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            // Reset previous upload state (clear previous files)
            resetUploadUI(false);

            // Display attached file name/s.
            const files = Array.from(fileInput.files);
            if (fileName) {
                fileName.innerHTML = files.map(f => '<div class="attached-item" style="margin-bottom:4px;">ATTACHED: ' + f.name + '</div>').join('');
            }
            // Start a simulated upload for combined files.
            simulateUpload(files);
        }
    }

    // Upload simulator: shows upload percentage.
    let uploadTimer = null;
    let uploadCompleted = false;
    function simulateUpload(files) {
        if (!progress) return;
        if (uploadTimer) { clearInterval(uploadTimer); uploadTimer = null; }
        uploadCompleted = false;

        // Calculates the total size of the files to estimate upload duration.
        const list = Array.isArray(files) ? files : [files];
        const totalSize = list.reduce((s, f) => s + (f.size || 0), 0) || 50000;

        // Estimate duration based on total size.
        const duration = Math.min(Math.max(2000, 1000 + totalSize / 200), 12000);
        const stepMs = 100;
        const steps = Math.max(1, Math.round(duration / stepMs));
        let current = 0;
        const increment = 100 / steps;

        // Reset progress bar and percentage display.
        progress.style.width = '0%';
        if (uploadPercentEl) uploadPercentEl.textContent = '0%';

        // Start the simulated upload timer.
        uploadTimer = setInterval(() => {
            current += increment;
            if (current >= 100) current = 100;
            progress.style.width = current + '%';
            if (uploadPercentEl) uploadPercentEl.textContent = Math.round(current) + '%';
            if (current >= 100) {
                clearInterval(uploadTimer);
                uploadTimer = null;
                uploadCompleted = true;
                if (uploadPercentEl) uploadPercentEl.textContent = '100%';
                
                // mark files as uploaded (add checkmark + label)
                try {
                    if (list && list.length && fileName) {
                        fileName.innerHTML = list.map(f => '<div class="uploaded-item">' +
                            '<span class="uploaded-check">&#10003;</span> UPLOADED: ' + f.name + '</div>').join('');
                    }
                } catch (e) {}
                
                // keep the completed state visible briefly, then reset progress UI but preserve files
                setTimeout(() => {
                    try { resetUploadUI(true); } catch (e) {}
                }, 1500);
            }
        }, stepMs);
    }

    // CORE STATE / THEME TOGGLE
    const voltageTrigger = document.getElementById('voltageTrigger');
    const coreStatusLabel = document.getElementById('coreStatusLabel');
    const body = document.body;

    // Applies the core state to the body.
    function applyCoreState(isRed) {
        if (isRed) {
            body.classList.add('red-voltage-core');
            if (coreStatusLabel) {
                coreStatusLabel.textContent = 'CORE_STATE: RED_VOLTAGE';
                coreStatusLabel.classList.remove('status-cyan');
                coreStatusLabel.classList.add('status-red');
            }
        } else {
            
            // Reset to the default cyan state.
            body.classList.remove('red-voltage-core');
            if (coreStatusLabel) {
                coreStatusLabel.textContent = 'CORE_STATE: CYAN_NOMINAL';
                coreStatusLabel.classList.remove('status-red');
                coreStatusLabel.classList.add('status-cyan');
            }
        }
    }

    // Action note system for unresponsive buttons.
    const actionNoteContainer = document.createElement('div');
    actionNoteContainer.id = 'actionNote';
    actionNoteContainer.className = 'action-note';
    document.body.appendChild(actionNoteContainer);

    // WeakMap to track timers for each button to avoid multiple notes.
    const actionNoteTimers = new WeakMap();
    let actionNoteTimer = null;

    // Displays a temporary action note message.
    function showActionNote(message, duration = 4500) {
        if (!actionNoteContainer) return;
        actionNoteContainer.textContent = message;
        actionNoteContainer.classList.add('visible');
        if (actionNoteTimer) clearTimeout(actionNoteTimer);
        actionNoteTimer = setTimeout(() => {
            actionNoteContainer.classList.remove('visible');
        }, duration);
    }

    // Marks an action as triggered (pressed) for a specific button, preventing duplicate triggers.
    function markActionTriggered(element) {
        if (!element) return;
        if (element.dataset) element.dataset.actionTriggered = '1';
        const pendingTimer = actionNoteTimers.get(element);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            actionNoteTimers.delete(element);
        }
    }

    // Click listener for all buttons to manage action notes and prevent multiple triggers.
    document.body.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button || button.disabled) return;

        // If the button has already been triggered, do not show another note.
        if (button.dataset.actionTriggered === '1') return;
        if (actionNoteTimers.has(button)) {
            clearTimeout(actionNoteTimers.get(button));
        }
        // Mark the button as not yet triggered for this click.
        if (button.dataset) button.dataset.actionTriggered = '0';

        // Set a timer to show the action note if the button is not triggered within 1 second.
        const timer = setTimeout(() => {
            if (button.dataset.actionTriggered !== '1') {
                showActionNote('Response may be slow. Please wait a moment before trying again.');
            }
            actionNoteTimers.delete(button);
        }, 1000);
        actionNoteTimers.set(button, timer);
    });

    // Initialize from localStorage
    try {
        const saved = localStorage.getItem('core_red') === '1';
        applyCoreState(saved);
    } catch (e) {
        // localStorage may be unavailable in some contexts
    }
    // Toggle core state on button click.
    if (voltageTrigger) {
        voltageTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            markActionTriggered(voltageTrigger);
            const isNowRed = body.classList.toggle('red-voltage-core');
            applyCoreState(isNowRed);
            try { localStorage.setItem('core_red', isNowRed ? '1' : '0'); } catch (e) {}
        });
        
        // keyboard accessibility
        voltageTrigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voltageTrigger.click(); }
        });
    }
});
