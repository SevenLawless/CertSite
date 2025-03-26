document.addEventListener('DOMContentLoaded', () => {
    // CUSTOMIZATION CONFIGURATION
    // Separate configurations for certificates with and without pictures
    const CERTIFICATE_CONFIG = {
        withPicture: {
            // Picture placement (x, y, radius)
            picture: {
                x: 800,      // Horizontal center position
                y: 835,      // Vertical position
                radius: 300, // Size of circular crop
                scale: 1     // Scale factor for picture size
            },
            // Name placement (x, y, font settings)
            name: {
                x: 800,      // Horizontal center position
                y: 1260,     // Vertical position
                fontSize: 84,// Font size
                fontFamily: '"Segoe UI", Arial, sans-serif', // Font family
                color: '#ffffff' // Text color
            },
            // Signature placement (x, y, font settings)
            signature: {
                x: 770,      // Always Start at x position == 760px
                y: 1910,     // Vertical position
                fontSize: 75,// Font size
                fontFamily: '"Segoe UI", Arial, sans-serif', // Font family
                color: '#188995' // Text color
            }
        },
        withoutPicture: {
            // Separate configuration for certificates without pictures
            name: {
                x: 800,      // Horizontal center position
                y: 950,      // Vertical position
                fontSize: 82,// Larger font size
                fontFamily: '"Segoe UI", Arial, sans-serif', // Font family
                color: '#ffffff' // Text color
            },
            // Signature placement (x, y, font settings)
            signature: {
                x: 790,      // Fixed horizontal position
                y: 1650,     // Vertical position
                fontSize: 75,// Slightly larger font size
                fontFamily: '"Segoe UI", Arial, sans-serif', // Font family
                color: '#188995' // Text color
            }
        }
    };

    // Expose configuration for external modification
    window.updateCertificateConfig = function(config) {
        Object.keys(config).forEach(key => {
            if (CERTIFICATE_CONFIG[key]) {
                Object.assign(CERTIFICATE_CONFIG[key], config[key]);
            }
        });
    };

    const form = document.getElementById('certificateForm');
    const includePictureCheckbox = document.getElementById('includePicture');
    const pictureInput = document.getElementById('pictureInput');
    const certificatePreview = document.getElementById('certificatePreview');
    const certificateContainer = document.getElementById('certificateContainer');
    const downloadCertificateBtn = document.getElementById('downloadCertificate');
    const languageToggle = document.querySelector('.language-toggle');
    const htmlRoot = document.getElementById('htmlRoot');

    // Create image cropper elements - improved UI
    const cropperModal = document.createElement('div');
    cropperModal.className = 'cropper-modal';
    cropperModal.innerHTML = `
        <div class="cropper-container">
            <h3>قم بقص الصورة</h3>
            
            <div class="image-container">
                <img id="cropperImage" src="" alt="Image to crop">
            </div>
            
            <div class="cropper-controls">
                <button class="cropper-control-btn" id="zoomIn">
                    <i class="fas fa-search-plus"></i> تكبير
                </button>
                <button class="cropper-control-btn" id="zoomOut">
                    <i class="fas fa-search-minus"></i> تصغير
                </button>
                <button class="cropper-control-btn" id="rotateLeft">
                    <i class="fas fa-undo"></i> تدوير
                </button>
                <button class="cropper-control-btn" id="resetCrop">
                    <i class="fas fa-sync-alt"></i> إعادة ضبط
                </button>
            </div>
            
            <div class="cropper-actions">
                <button id="applyCrop" class="cta-button">
                    <i class="fas fa-check"></i> تطبيق
                </button>
                <button id="cancelCrop" class="secondary-button">
                    <i class="fas fa-times"></i> إلغاء
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(cropperModal);

    // Add styles for the cropper modal
    const style = document.createElement('style');
    style.textContent = `
        .cropper-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .cropper-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        }
        .image-container {
            max-height: 70vh;
            overflow: hidden;
        }
        .cropper-controls {
            margin: 15px 0;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .cropper-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);

    let cropper;
    let croppedImageDataURL = null;

    // Language Toggle Functionality
    if (languageToggle) {
        languageToggle.addEventListener('click', () => {
            const currentLang = htmlRoot.getAttribute('dir');
            
            if (currentLang === 'rtl') {
                // Switch to English
                htmlRoot.setAttribute('dir', 'ltr');
                htmlRoot.setAttribute('lang', 'en');
                
                // Change button text
                languageToggle.querySelector('span').textContent = 'عربي';
                
                // Change all text elements
                document.querySelectorAll('[data-en]').forEach(el => {
                    if (el.tagName === 'INPUT' || el.tagName === 'BUTTON') {
                        el.placeholder = el.getAttribute('data-en-placeholder') || '';
                        el.removeAttribute('dir');
                    }
                    el.textContent = el.getAttribute('data-en');
                });
            } else {
                // Switch to Arabic
                htmlRoot.setAttribute('dir', 'rtl');
                htmlRoot.setAttribute('lang', 'ar');
                
                // Change button text
                languageToggle.querySelector('span').textContent = 'English';
                
                // Change all text elements
                document.querySelectorAll('[data-ar]').forEach(el => {
                    if (el.tagName === 'INPUT' || el.tagName === 'BUTTON') {
                        el.placeholder = el.getAttribute('data-ar-placeholder') || '';
                        el.setAttribute('dir', 'rtl');
                    }
                    el.textContent = el.getAttribute('data-ar');
                });
            }
        });
    }

    // Picture Input Toggle - improved to always create the label
    includePictureCheckbox.addEventListener('change', () => {
        if (includePictureCheckbox.checked) {
            // Add a label to make it clearer
            const fileLabel = document.createElement('div');
            fileLabel.className = 'file-upload-label';
            fileLabel.textContent = 'انقر هنا لاختيار صورة';
            
            // Only add the label if it doesn't exist already
            if (!document.querySelector('.file-upload-label')) {
                pictureInput.parentNode.insertBefore(fileLabel, pictureInput);
                
                // Make the label clickable to open file dialog
                fileLabel.addEventListener('click', () => {
                    pictureInput.click();
                });
            }
        } else {
            // Remove the label if it exists
            const fileLabel = document.querySelector('.file-upload-label');
            if (fileLabel) {
                fileLabel.parentNode.removeChild(fileLabel);
            }
            
            // Remove any existing preview
            const existingPreview = document.querySelector('.cropped-preview');
            if (existingPreview) {
                existingPreview.parentNode.removeChild(existingPreview);
            }
            
            // Reset any cropped image data
            croppedImageDataURL = null;
        }
    });

    // Add event listener for picture input change - improved for better UX
    pictureInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // Validate file size
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('الملف كبير جدًا. يرجى اختيار صورة أقل من 10 ميجابايت.');
                pictureInput.value = '';
                return;
            }
            
            // Validate file type
            if (!file.type.match('image.*')) {
                alert('يرجى اختيار ملف صورة صالح.');
                pictureInput.value = '';
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(event) {
                // Show cropper modal
                const cropperImage = document.getElementById('cropperImage');
                cropperImage.src = event.target.result;
                
                // Show modal with animation effect
                cropperModal.style.display = 'flex';
                cropperModal.style.opacity = '0';
                
                // Ensure the modal is visible in the viewport
                requestAnimationFrame(() => {
                    cropperModal.style.opacity = '1';
                    
                    // Initialize cropper with improved options
                    if (cropper) {
                        cropper.destroy();
                    }
                    
                    cropper = new Cropper(cropperImage, {
                        aspectRatio: 1,
                        viewMode: 1,
                        dragMode: 'move',
                        autoCropArea: 0.9,
                        responsive: true,
                        guides: true,
                        center: true,
                        highlight: true,
                        background: false,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                        minCropBoxWidth: 200,
                        minCropBoxHeight: 200,
                        wheelZoomRatio: 0.1,
                        ready() {
                            // Add animation to draw attention
                            const cropBox = document.querySelector('.cropper-crop-box');
                            if (cropBox) {
                                cropBox.style.transition = 'all 0.3s';
                                cropBox.style.boxShadow = '0 0 0 2000px rgba(0, 0, 0, 0.6)';
                            }
                        }
                    });
                });
            };
            
            reader.readAsDataURL(file);
        }
    });

    // Add controls functionality
    document.getElementById('zoomIn').addEventListener('click', () => {
        if (cropper) cropper.zoom(0.1);
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        if (cropper) cropper.zoom(-0.1);
    });

    document.getElementById('rotateLeft').addEventListener('click', () => {
        if (cropper) cropper.rotate(-90);
    });

    document.getElementById('resetCrop').addEventListener('click', () => {
        if (cropper) cropper.reset();
    });

    // Apply crop button - enhanced with improved feedback
    document.getElementById('applyCrop').addEventListener('click', () => {
        if (!cropper) return;
        
        // Show loading effect
        const cropBtn = document.getElementById('applyCrop');
        const originalBtnContent = cropBtn.innerHTML;
        cropBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
        cropBtn.disabled = true;
        
        // Add slight delay to show the processing animation
        setTimeout(() => {
            // Get cropped canvas
            const canvas = cropper.getCroppedCanvas({
                width: 400, 
                height: 400,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            
            // Convert to data URL
            croppedImageDataURL = canvas.toDataURL('image/jpeg', 0.92); // Higher quality
            
            // Hide modal with smooth animation
            cropperModal.style.opacity = '0';
            cropperModal.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                cropperModal.style.display = 'none';
                cropBtn.innerHTML = originalBtnContent;
                cropBtn.disabled = false;
                cropperModal.style.transform = 'translateY(0)';
                
                // Show preview of cropped image with animation
                const previewContainer = document.createElement('div');
                previewContainer.className = 'cropped-preview';
                previewContainer.innerHTML = `
                    <img src="${croppedImageDataURL}" alt="Cropped image preview">
                `;
                
                // Replace any existing preview
                const existingPreview = document.querySelector('.cropped-preview');
                if (existingPreview) {
                    existingPreview.parentNode.removeChild(existingPreview);
                }
                
                // Add preview right after file input
                pictureInput.parentNode.appendChild(previewContainer);
                
                // Add animation to show success
                setTimeout(() => {
                    const previewImg = previewContainer.querySelector('img');
                    if (previewImg) {
                        previewImg.style.transform = 'scale(1.1)';
                        setTimeout(() => {
                            previewImg.style.transform = 'scale(1)';
                        }, 200);
                    }
                }, 10);
            }, 300);
        }, 500); // 500ms delay to show processing animation
    });

    // Apply crop button
    document.getElementById('applyCrop').addEventListener('click', () => {
        if (!cropper) return;
        
        // Show loading effect
        const cropBtn = document.getElementById('applyCrop');
        cropBtn.textContent = 'جاري التطبيق...';
        cropBtn.disabled = true;
        
        // Get cropped canvas
        const canvas = cropper.getCroppedCanvas({
            width: 400, // Higher resolution
            height: 400,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        
        // Convert to data URL
        croppedImageDataURL = canvas.toDataURL('image/jpeg', 0.9); // 90% quality
        
        // Hide modal with fade-out effect
        cropperModal.style.opacity = '0';
        setTimeout(() => {
            cropperModal.style.display = 'none';
            cropBtn.textContent = 'تطبيق';
            cropBtn.disabled = false;
        }, 300);
        
        // Show preview of cropped image with animation - without success message
        const previewContainer = document.createElement('div');
        previewContainer.className = 'cropped-preview';
        previewContainer.innerHTML = `
            <img src="${croppedImageDataURL}" alt="Cropped image preview">
        `;
        
        // Replace any existing preview
        const existingPreview = document.querySelector('.cropped-preview');
        if (existingPreview) {
            existingPreview.parentNode.removeChild(existingPreview);
        }
        
        // Add preview right after file input
        pictureInput.parentNode.appendChild(previewContainer);
        
        // Add animation to show success
        setTimeout(() => {
            const previewImg = previewContainer.querySelector('img');
            if (previewImg) {
                previewImg.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    previewImg.style.transform = 'scale(1)';
                }, 200);
            }
        }, 10);
    });

    // Cancel crop button
    document.getElementById('cancelCrop').addEventListener('click', () => {
        // Fade out modal
        cropperModal.style.opacity = '0';
        setTimeout(() => {
            cropperModal.style.display = 'none';
        }, 300);
        
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        // Reset file input
        pictureInput.value = '';
        croppedImageDataURL = null;
        
        // Remove preview if exists
        const existingPreview = document.querySelector('.cropped-preview');
        if (existingPreview) {
            existingPreview.parentNode.removeChild(existingPreview);
        }
    });

    // Set up GA Debug panel
    const gaDebug = document.getElementById('ga-debug');
    const gaDebugLog = document.getElementById('ga-debug-log');
    
    // Override the logEvent function to show in the debug panel
    window.logEvent = function(eventName, params) {
        console.log('🔍 GA Event:', eventName, params);
        
        // Show debug panel
        if (gaDebug) {
            gaDebug.style.display = 'block';
        }
        
        // Add to debug log
        if (gaDebugLog) {
            const now = new Date();
            const timestamp = now.getHours().toString().padStart(2, '0') + ':' + 
                             now.getMinutes().toString().padStart(2, '0') + ':' + 
                             now.getSeconds().toString().padStart(2, '0');
            
            gaDebugLog.innerHTML = `<div><strong>${timestamp} - ${eventName}</strong><br>` + 
                                  JSON.stringify(params).substring(0, 100) + 
                                  (JSON.stringify(params).length > 100 ? '...' : '') + 
                                  '</div>' + gaDebugLog.innerHTML;
            
            // Limit log size
            if (gaDebugLog.children.length > 10) {
                gaDebugLog.removeChild(gaDebugLog.lastChild);
            }
        }
        
        return true;
    };
    
    // Manual test function for GA events
    window.testGAEvent = function() {
        // Test GA connectivity
        logEvent('test_event', {'test_param': 'test_value'});
        gtag('event', 'test_event', {
            'event_category': 'Testing',
            'event_label': 'Test Event',
            'value': 1,
            'send_to': 'G-GQ3T6MFMZM'
        });
        
        // Direct measurement protocol hit (alternative method)
        const img = new Image();
        img.src = 'https://www.google-analytics.com/collect?v=2&tid=G-GQ3T6MFMZM&cid=' + 
                 (localStorage.getItem('ga_client_id') || Math.random().toString(36).substring(2)) + 
                 '&t=event&ec=Testing&ea=test_direct&el=Direct Test&ev=1';
        
        // Store client ID for consistent tracking
        if (!localStorage.getItem('ga_client_id')) {
            localStorage.setItem('ga_client_id', Math.random().toString(36).substring(2));
        }
        
        alert('Test event sent to Google Analytics. Check the console and debug panel.');
        return true;
    };

    // Add simple local analytics tracking
    function incrementLocalCounter(counterName) {
        const counters = JSON.parse(localStorage.getItem('certSiteCounters') || '{}');
        counters[counterName] = (counters[counterName] || 0) + 1;
        localStorage.setItem('certSiteCounters', JSON.stringify(counters));
        return counters[counterName];
    }

    // Track page visit
    incrementLocalCounter('pageVisits');
    // Create a timestamp for this visit if not exists
    if (!localStorage.getItem('firstVisit')) {
        localStorage.setItem('firstVisit', new Date().toISOString());
    }

    // Certificate Generation
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Track certificate generation with Google Analytics
        const generateParams = {
            'event_category': 'Certificate',
            'event_label': 'Generate',
            'value': 1,
            'send_to': 'G-GQ3T6MFMZM',
            'device_type': getDeviceType()
        };
        
        // Log event for debugging
        logEvent('generate_certificate', generateParams);
        
        // Send to Google Analytics
        gtag('event', 'generate_certificate', generateParams);
        
        // Direct interaction for GA4 - this should work even if the custom event doesn't
        gtag('event', 'conversion', {
            'send_to': 'G-GQ3T6MFMZM',
            'event_category': 'Certificate',
            'event_action': 'Generated'
        });

        // Also track with local counter
        const generateCount = incrementLocalCounter('certificatesGenerated');
        console.log(`Certificate generated (${generateCount} total)`);

        const fullName = document.getElementById('fullName').value;
        const signature = document.getElementById('signature').value;
        const gender = document.querySelector('input[name="gender"]:checked').value;
        let pictureDataURL = null;

        // Select Certificate Template
        const selectTemplate = (gender, hasPicture) => {
            if (gender === 'male') {
                return hasPicture ? 'templates/male-certificate.jpg' : 'templates/male-no-certificate.jpg';
            } else {
                return hasPicture ? 'templates/female-certificate.jpg' : 'templates/female-no-certificate.jpg';
            }
        };

        // Picture Handling
        if (includePictureCheckbox.checked) {
            if (croppedImageDataURL) {
                // Use the cropped image if available
                pictureDataURL = croppedImageDataURL;
                generateCertificate(fullName, signature, gender, pictureDataURL, selectTemplate(gender, true));
            } else if (pictureInput.files.length > 0) {
                // Fallback to original image if no cropped version
                const reader = new FileReader();
                reader.onload = function(event) {
                    pictureDataURL = event.target.result;
                    generateCertificate(fullName, signature, gender, pictureDataURL, selectTemplate(gender, true));
                };
                reader.readAsDataURL(pictureInput.files[0]);
            } else {
                // No image provided
                generateCertificate(fullName, signature, gender, null, selectTemplate(gender, false));
            }
        } else {
            generateCertificate(fullName, signature, gender, null, selectTemplate(gender, false));
        }
    });

    function generateCertificate(fullName, signature, gender, pictureDataURL, templateSrc) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = function() {
            canvas.width = 1600;
            canvas.height = 2000;
            
            // Draw background template
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Determine text direction and font
            const isArabic = htmlRoot.getAttribute('dir') === 'rtl';
            ctx.textAlign = 'center';
            
            // Select configuration based on picture presence
            const config = pictureDataURL ? 
                CERTIFICATE_CONFIG.withPicture : 
                CERTIFICATE_CONFIG.withoutPicture;

            // Add Name
            ctx.font = `bold ${config.name.fontSize}px ${config.name.fontFamily}`;
            ctx.fillStyle = config.name.color;
            ctx.fillText(fullName, config.name.x, config.name.y);

            // Add Signature - Updated for RTL text
            ctx.font = `${config.signature.fontSize}px ${config.signature.fontFamily}`;
            ctx.fillStyle = config.signature.color;
            ctx.textAlign = 'right'; // Set text alignment to right for RTL text
            ctx.fillText(signature, config.signature.x, config.signature.y);

            // Add Circular Profile Picture if present
            if (pictureDataURL) {
                const picture = new Image();
                picture.onload = function() {
                    // Create circular clipping path
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(
                        config.picture.x, 
                        config.picture.y, 
                        config.picture.radius, 
                        0, 
                        Math.PI * 2, 
                        true
                    );
                    ctx.closePath();
                    ctx.clip();

                    // Draw picture
                    const scale = config.picture.scale * 
                        Math.max(
                            config.picture.radius * 2 / picture.width, 
                            config.picture.radius * 2 / picture.height
                        );
                    const scaledWidth = picture.width * scale;
                    const scaledHeight = picture.height * scale;
                    const offsetX = config.picture.x - scaledWidth / 2;
                    const offsetY = config.picture.y - scaledHeight / 2;

                    ctx.drawImage(picture, offsetX, offsetY, scaledWidth, scaledHeight);
                    ctx.restore();

                    displayCertificate(canvas);
                };
                picture.src = pictureDataURL;
            } else {
                displayCertificate(canvas);
            }
        };
        img.src = templateSrc || 'https://via.placeholder.com/1600x2000.png?text=Certificate+Template';
    }

    function displayCertificate(canvas) {
        certificateContainer.innerHTML = '';
        certificateContainer.appendChild(canvas);
        certificatePreview.classList.remove('hidden');
        
        // Automatically scroll to the certificate preview
        certificatePreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Download Certificate
    downloadCertificateBtn.addEventListener('click', () => {
        // Get device information
        const deviceType = getDeviceType();
        
        // Get country information (using IP geolocation)
        getCountryInfo().then(country => {
            // Track the certificate download event with enhanced data
            const downloadParams = {
                'event_category': 'Certificate',
                'event_label': 'Download',
                'value': 1,
                'send_to': 'G-GQ3T6MFMZM',
                'device_type': deviceType,
                'country': country,
                'user_agent': navigator.userAgent
            };
            
            // Log event for debugging
            logEvent('download_certificate', downloadParams);
            
            // Send to Google Analytics
            gtag('event', 'download_certificate', downloadParams);
            
            // Direct interaction for GA4 - this should work even if the custom event doesn't
            gtag('event', 'conversion', {
                'send_to': 'G-GQ3T6MFMZM',
                'event_category': 'Certificate',
                'event_action': 'Downloaded'
            });
            
            // Also track with local counter
            const downloadCount = incrementLocalCounter('certificatesDownloaded');
            console.log(`Certificate downloaded (${downloadCount} total)`);
            
            const canvas = certificateContainer.querySelector('canvas');
            const fullName = document.getElementById('fullName').value;
            const link = document.createElement('a');
            link.download = `${fullName}_certificate.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    });
    
    // Function to detect device type
    function getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
            return 'Tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
            return 'Mobile';
        }
        return 'Desktop';
    }
    
    // Function to get country information
    function getCountryInfo() {
        return fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => data.country_name)
            .catch(() => 'Unknown');
    }

    // Add general click tracking for buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(e) {
            const buttonText = this.textContent.trim();
            gtag('event', 'button_click', {
                'event_category': 'UI Interaction',
                'event_label': buttonText,
                'value': 1,
                'send_to': 'G-GQ3T6MFMZM'
            });
        });
    });

    // Add a simple way to check statistics in console
    window.checkLocalStats = function() {
        const counters = JSON.parse(localStorage.getItem('certSiteCounters') || '{}');
        const firstVisit = localStorage.getItem('firstVisit') || 'Unknown';
        const daysSinceFirst = firstVisit !== 'Unknown' ? 
            Math.floor((new Date() - new Date(firstVisit)) / (1000 * 60 * 60 * 24)) : 0;
        
        console.table({
            'Page Visits': counters.pageVisits || 0,
            'Certificates Generated': counters.certificatesGenerated || 0,
            'Certificates Downloaded': counters.certificatesDownloaded || 0,
            'Days Tracking': daysSinceFirst,
            'First Visit': new Date(firstVisit).toLocaleString()
        });
        
        return counters;
    };

    // Setup statistics modal
    const statsToggle = document.getElementById('stats-toggle');
    const statsModal = document.getElementById('stats-modal');
    const statsClose = document.querySelector('.stats-close');
    const statsData = document.getElementById('stats-data');

    if (statsToggle && statsModal) {
        // Show modal when clicking the stats button
        statsToggle.addEventListener('click', function() {
            statsModal.style.display = 'block';
            updateStatsDisplay();
        });

        // Close modal when clicking X
        if (statsClose) {
            statsClose.addEventListener('click', function() {
                statsModal.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === statsModal) {
                statsModal.style.display = 'none';
            }
        });

        // Update stats display function
        function updateStatsDisplay() {
            const counters = JSON.parse(localStorage.getItem('certSiteCounters') || '{}');
            const firstVisit = localStorage.getItem('firstVisit') || 'Unknown';
            const daysSinceFirst = firstVisit !== 'Unknown' ? 
                Math.floor((new Date() - new Date(firstVisit)) / (1000 * 60 * 60 * 24)) : 0;
            
            let html = '<table class="stats-table">';
            html += '<tr><td>Page Visits</td><td>' + (counters.pageVisits || 0) + '</td></tr>';
            html += '<tr><td>Certificates Generated</td><td>' + (counters.certificatesGenerated || 0) + '</td></tr>';
            html += '<tr><td>Certificates Downloaded</td><td>' + (counters.certificatesDownloaded || 0) + '</td></tr>';
            html += '<tr><td>Days Tracking</td><td>' + daysSinceFirst + '</td></tr>';
            html += '<tr><td>First Visit</td><td>' + (firstVisit !== 'Unknown' ? new Date(firstVisit).toLocaleString() : 'Unknown') + '</td></tr>';
            html += '</table>';
            
            statsData.innerHTML = html;
        }
    }
});
