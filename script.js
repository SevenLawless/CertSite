document.addEventListener('DOMContentLoaded', () => {
    // CUSTOMIZATION CONFIGURATION
    // Separate configurations for certificates with and without pictures
    const CERTIFICATE_CONFIG = {
        withPicture: {
            // Picture placement (x, y, radius)
            picture: {
                x: 823,      // Horizontal center position
                y: 728,      // Vertical position
                radius: 220, // Size of circular crop
                scale: 1     // Scale factor for picture size
            },
            // Name placement (x, y, font settings)
            name: {
                x: 800,      // Horizontal center position
                y: 1130,     // Vertical position
                fontSize: 132,// Font size
                fontFamily: '"Amiri", serif', // Arabic font
                color: '#442968' // Text color
            },
            // Signature placement (x, y, font settings)
            signature: {
                x: 410,      // Always Start at x position == 760px
                y: 1615,     // Vertical position
                fontSize: 112,// Font size
                fontFamily: '"Amiri", serif', // Arabic font
                color: '#db5c29' // Text color
            }
        },
        withoutPicture: {
            // Separate configuration for certificates without pictures
            name: {
                x: 800,      // Horizontal center position
                y: 790,      // Vertical position
                fontSize: 152,// Larger font size
                fontFamily: '"Amiri", serif', // Arabic font
                color: '#442968' // Text color
            },
            // Signature placement (x, y, font settings)
            signature: {
                x: 390,      // Fixed horizontal position
                y: 1425,     // Vertical position
                fontSize: 112,// Slightly larger font size
                fontFamily: '"Amiri", serif', // Arabic font
                color: '#db5c29' // Text color
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

    // Only set up form/cropper when on main page (form exists)
    const isPreviewPage = !form && document.getElementById('certificate-preview-container');

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
    if (form) document.body.appendChild(cropperModal);

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
    if (form) document.head.appendChild(style);

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
    if (includePictureCheckbox) includePictureCheckbox.addEventListener('change', () => {
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
    if (pictureInput) pictureInput.addEventListener('change', (e) => {
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

    // Add controls functionality (only when form/cropper exist)
    if (form) {
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

        document.getElementById('cancelCrop').addEventListener('click', () => {
            cropperModal.style.opacity = '0';
            setTimeout(() => { cropperModal.style.display = 'none'; }, 300);
            if (cropper) { cropper.destroy(); cropper = null; }
            pictureInput.value = '';
            croppedImageDataURL = null;
            const existingPreview = document.querySelector('.cropped-preview');
            if (existingPreview) existingPreview.parentNode.removeChild(existingPreview);
        });
    }

    // Certificate Generation
    if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Track certificate generation with Google Analytics
        gtag('event', 'generate_certificate', {
            'event_category': 'Certificate',
            'event_label': 'Certss'
        });

        const fullName = document.getElementById('fullName').value;
        const signature = document.getElementById('signature').value;
        const gender = document.querySelector('input[name="gender"]:checked').value;
        let pictureDataURL = null;

        // Select Certificate Template
        const selectTemplate = (gender, hasPicture) => {
            return hasPicture ? 'templates/certificate.png' : 'templates/nocertificate.png';
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

    function generateCertificate(fullName, signature, gender, pictureDataURL, templateSrc, targetContainer) {
        const onDone = targetContainer
            ? (canvas) => { targetContainer.innerHTML = ''; targetContainer.appendChild(canvas); }
            : (canvas) => displayCertificate(canvas);
        renderCertificateToCanvas(fullName, signature, pictureDataURL, templateSrc, onDone);
    }

    // Shared drawing logic: can render to main page or any container (for preview page)
    function renderCertificateToCanvas(fullName, signature, pictureDataURL, templateSrc, onDone) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const startLoad = () => tryLoad(templateSrc || 'templates/nocertificate.png', false);

        const tryLoad = (src, isRetry) => {
            const img = new Image();
            img.onload = function() {
                canvas.width = 1600;
                canvas.height = 2000;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                ctx.textAlign = 'center';
                const config = pictureDataURL ?
                    CERTIFICATE_CONFIG.withPicture :
                    CERTIFICATE_CONFIG.withoutPicture;

                ctx.font = `bold ${config.name.fontSize}px ${config.name.fontFamily}`;
                ctx.fillStyle = config.name.color;
                ctx.fillText(fullName, config.name.x, config.name.y);

                ctx.font = `${config.signature.fontSize}px ${config.signature.fontFamily}`;
                ctx.fillStyle = config.signature.color;
                ctx.textAlign = 'right';
                ctx.fillText(signature, config.signature.x, config.signature.y);

                if (pictureDataURL) {
                    const picture = new Image();
                    picture.onload = function() {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(config.picture.x, config.picture.y, config.picture.radius, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.clip();
                        const scale = config.picture.scale * Math.max(config.picture.radius * 2 / picture.width, config.picture.radius * 2 / picture.height);
                        const scaledWidth = picture.width * scale;
                        const scaledHeight = picture.height * scale;
                        ctx.drawImage(picture, config.picture.x - scaledWidth / 2, config.picture.y - scaledHeight / 2, scaledWidth, scaledHeight);
                        ctx.restore();
                        onDone(canvas);
                    };
                    picture.src = pictureDataURL;
                } else {
                    onDone(canvas);
                }
            };
            img.onerror = function() {
                const alt = src.replace(/\.(jpe?g|png)$/i, (_, ext) => ext && ext.toLowerCase().startsWith('j') ? '.png' : '.jpeg');
                if (alt !== src && !isRetry) tryLoad(alt, true);
                else onDone(canvas); // show canvas even if blank so container updates
            };
            img.src = src;
        };

        // Wait for Arabic font to load so certificate text renders correctly
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(startLoad);
        } else {
            startLoad();
        }
    }

    // Expose for preview page: render certificate with sample data to any container
    window.renderCertificatePreview = function(container, options) {
        const opts = options || {};
        const fullName = opts.fullName || 'اسم الطفل';
        const signature = opts.signature || 'التوقيع';
        const templateSrc = opts.withPicture ? 'templates/certificate.png' : 'templates/nocertificate.png';
        const pictureDataURL = opts.pictureDataURL || null;
        renderCertificateToCanvas(fullName, signature, pictureDataURL, templateSrc, (canvas) => {
            container.innerHTML = '';
            container.appendChild(canvas);
        });
    };

    function displayCertificate(canvas) {
        certificateContainer.innerHTML = '';
        certificateContainer.appendChild(canvas);
        certificatePreview.classList.remove('hidden');
        
        // Automatically scroll to the certificate preview
        certificatePreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Download Certificate
    if (downloadCertificateBtn) downloadCertificateBtn.addEventListener('click', () => {
        // Track download event with Google Analytics
        gtag('event', 'download_certificate', {
            'event_category': 'engagement',
            'event_label': 'Certificate Download',
            'value': 1,
            'non_interaction': false,
            'device': getDeviceType()
        });
        
        // Also log locally to console for debugging
        console.log('Certificate downloaded at: ' + new Date().toLocaleString());
        
        const canvas = certificateContainer.querySelector('canvas');
        const fullName = document.getElementById('fullName').value;
        const link = document.createElement('a');
        link.download = `شهادة تقدير ل ${fullName}`;
        link.href = canvas.toDataURL();
        link.click();
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

    // Preview page: render sample certificate on load
    if (isPreviewPage) {
        const container = document.getElementById('certificate-preview-container');
        if (container && window.renderCertificatePreview) {
            window.renderCertificatePreview(container);
        }
    }
});
