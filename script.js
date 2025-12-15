// الإعدادات
const CONFIG = {
    CHAT_API_URL: "https://udghbdlcrzvkfsyjqkch.supabase.co/functions/v1/chat",
    API_KEY: "wgpt_Ibpy8rL4-Apdj-3GDX-JKzt-q07HH1W2nb77",
    IMAGE_API_URL: "https://udghbdlcrzvkfsyjqkch.supabase.co/functions/v1/chat",
    MAX_MESSAGE_LENGTH: 5000,
    VALID_LICENSE_KEYS: [
        "WG4T8H7K9D2F5R",
        "X3B7N9M2Q4R6T8",
        "A1B2C3D4E5F6G7",
        "H8J9K0L1M2N3P4",
        "Q5W6E7R8T9Y0U1"
    ]
};

// العناصر
const elements = {
    // ترخيص
    licenseModal: document.getElementById('licenseModal'),
    licenseKey: document.getElementById('licenseKey'),
    licenseStatus: document.getElementById('licenseStatus'),
    activateBtn: document.getElementById('activateBtn'),
    
    // تسجيل الدخول
    loginModal: document.getElementById('loginModal'),
    loginUsername: document.getElementById('loginUsername'),
    loginBtn: document.getElementById('loginBtn'),
    
    // محادثة
    chatBox: document.getElementById('chat-box'),
    chatInput: document.getElementById('chatInput'),
    submitBtn: document.getElementById('submitBtn'),
    micBtn: document.getElementById('micBtn'),
    clearBtn: document.getElementById('clearBtn'),
    
    // قائمة
    menuBtn: document.getElementById('menuBtn'),
    menuOverlay: document.getElementById('menuOverlay'),
    sideMenu: document.getElementById('sideMenu'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // صور
    imageBtn: document.getElementById('imageBtn'),
    toggleImageBtn: document.getElementById('toggleImageBtn'),
    imageModal: document.getElementById('imageModal'),
    imagePrompt: document.getElementById('imagePrompt'),
    imageSize: document.getElementById('imageSize'),
    imageStyle: document.getElementById('imageStyle'),
    generateImageBtn: document.getElementById('generateImageBtn'),
    imageStatus: document.getElementById('imageStatus'),
    imagePreview: document.getElementById('imagePreview'),
    generatedImage: document.getElementById('generatedImage'),
    downloadImageBtn: document.getElementById('downloadImageBtn'),
    newImageBtn: document.getElementById('newImageBtn'),
    closeImageBtn: document.getElementById('closeImageBtn')
};

// الحالة
let state = {
    isLicensed: localStorage.getItem('wgpt_licensed') === 'true',
    licenseKey: localStorage.getItem('wgpt_license_key') || '',
    username: localStorage.getItem('wgpt_username') || '',
    sessionId: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    conversation: JSON.parse(localStorage.getItem('wgpt_conversation')) || [],
    isRecording: false,
    recognition: null,
    isConnected: true,
    generatedImageData: null,
    imageGenerationEnabled: localStorage.getItem('wgpt_image_enabled') !== 'false' // مفعل افتراضياً
};

// ==================== تهيئة التطبيق ====================
function initApp() {
    // التحقق من الترخيص
    if (!state.isLicensed) {
        showLicenseModal();
    } else {
        // التحقق من تسجيل الدخول
        if (!state.username) {
            elements.loginModal.classList.add('active');
            elements.loginUsername.focus();
        } else {
            showChatInterface();
        }
    }

    setupEventListeners();
    updateConnectionStatus();
    
    // تهيئة زر التبديل
    updateImageToggleButton();
    
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
}

// ==================== إعداد المستمعين ====================
function setupEventListeners() {
    // الترخيص
    elements.activateBtn.addEventListener('click', handleLicenseActivation);
    elements.licenseKey.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLicenseActivation();
    });
    elements.licenseKey.addEventListener('input', formatLicenseKey);
    
    // تسجيل الدخول
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.loginUsername.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // المحادثة
    elements.submitBtn.addEventListener('click', sendMessage);
    elements.chatInput.addEventListener('input', handleInputChange);
    elements.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // الميكروفون
    elements.micBtn.addEventListener('click', toggleVoiceInput);
    
    // مسح المحادثة
    elements.clearBtn.addEventListener('click', clearChat);
    
    // القائمة
    elements.menuBtn.addEventListener('click', toggleMenu);
    elements.menuOverlay.addEventListener('click', toggleMenu);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // إنشاء الصور
    elements.imageBtn.addEventListener('click', showImageModal);
    elements.toggleImageBtn.addEventListener('click', toggleImageGeneration);
    elements.generateImageBtn.addEventListener('click', handleGenerateImage);
    elements.downloadImageBtn.addEventListener('click', downloadImage);
    elements.newImageBtn.addEventListener('click', resetImageForm);
    elements.closeImageBtn.addEventListener('click', hideImageModal);
    
    // تعديل حجم مربع النص تلقائياً
    elements.chatInput.addEventListener('input', autoResize);
    elements.imagePrompt.addEventListener('input', autoResize);
}

// ==================== وظائف الترخيص ====================
function showLicenseModal() {
    elements.licenseModal.style.display = 'flex';
    elements.licenseKey.focus();
}

function hideLicenseModal() {
    elements.licenseModal.style.display = 'none';
}

function formatLicenseKey() {
    let value = elements.licenseKey.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    elements.licenseKey.value = value;
    elements.activateBtn.disabled = value.length !== 14;
}

function handleLicenseActivation() {
    const key = elements.licenseKey.value.trim().toUpperCase();
    
    if (key.length !== 14) {
        showLicenseStatus('المفتاح يجب أن يكون 14 حرفاً', 'error');
        return;
    }

    if (isValidLicenseKey(key)) {
        state.isLicensed = true;
        state.licenseKey = key;
        localStorage.setItem('wgpt_licensed', 'true');
        localStorage.setItem('wgpt_license_key', key);
        
        showLicenseStatus('✓ تم تفعيل الترخيص بنجاح!', 'success');
        
        setTimeout(() => {
            hideLicenseModal();
            elements.loginModal.classList.add('active');
            elements.loginUsername.focus();
        }, 2000);
    } else {
        showLicenseStatus('❌ مفتاح ترخيص غير صالح', 'error');
        elements.licenseKey.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            elements.licenseKey.style.animation = '';
        }, 500);
    }
}

function isValidLicenseKey(key) {
    if (key.length !== 14) return false;
    if (!/^[A-Z0-9]{14}$/.test(key)) return false;
    if (CONFIG.VALID_LICENSE_KEYS.includes(key)) return true;
    return false;
}

function showLicenseStatus(message, type) {
    elements.licenseStatus.textContent = message;
    elements.licenseStatus.className = `license-status ${type}`;
    elements.licenseStatus.style.display = 'block';
}

// ==================== تسجيل الدخول ====================
function handleLogin() {
    const username = elements.loginUsername.value.trim();
    if (!username) {
        showError("يرجى إدخال اسم المستخدم");
        return;
    }

    if (username.length > 30) {
        showError("اسم المستخدم يجب أن يكون أقل من 30 حرفاً");
        return;
    }

    state.username = username;
    localStorage.setItem('wgpt_username', username);
    
    elements.loginModal.classList.remove('active');
    showChatInterface();
}

// ==================== واجهة المحادثة ====================
function showChatInterface() {
    loadPreviousConversation();
    handleInputChange();
}

function loadPreviousConversation() {
    if (state.conversation.length > 0) {
        document.querySelector('.welcome-screen')?.remove();
        state.conversation.forEach(msg => {
            addMessage(msg.role, msg.content, false);
        });
        scrollToBottom();
    }
}

function handleInputChange() {
    const text = elements.chatInput.value.trim();
    elements.submitBtn.disabled = !text;
}

function autoResize(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = newHeight + 'px';
}

// ==================== إرسال الرسائل ====================
async function sendMessage() {
    const text = elements.chatInput.value.trim();
    if (!text) return;

    if (text.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showError(`الرسالة طويلة جداً (الحد الأقصى ${CONFIG.MAX_MESSAGE_LENGTH} حرف)`);
        return;
    }

    document.querySelector('.welcome-screen')?.remove();

    addMessage('user', text);
    elements.chatInput.value = '';
    handleInputChange();
    elements.submitBtn.disabled = true;

    state.conversation.push({ 
        role: 'user', 
        content: text, 
        timestamp: new Date().toISOString() 
    });
    saveConversation();

    const loadingId = showLoading();

    try {
        const response = await fetch(CONFIG.CHAT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: CONFIG.API_KEY,
                message: text,
                session_id: state.sessionId,
                user_id: state.username,
                license_key: state.licenseKey
            })
        });

        removeLoading(loadingId);

        if (!response.ok) {
            throw new Error(`خطأ في الخادم: ${response.status}`);
        }

        const data = await response.json();

        if (data.response) {
            addMessage('bot', data.response);
            state.conversation.push({ 
                role: 'bot', 
                content: data.response, 
                timestamp: new Date().toISOString() 
            });
            saveConversation();
        } else {
            addMessage('bot', `خطأ: ${data.error || 'خطأ غير معروف'}`);
        }

    } catch (error) {
        console.error('خطأ API:', error);
        removeLoading(loadingId);
        
        let errorMessage = "خطأ في الاتصال. يرجى المحاولة مرة أخرى.";
        if (error.message.includes('Failed to fetch')) {
            errorMessage = "خطأ في الشبكة. يرجى التحقق من اتصالك.";
        }
        
        addMessage('bot', `⚠️ ${errorMessage}`);
    }
}

// ==================== إضافة الرسائل ====================
function addMessage(role, text, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${role}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'msg-bubble';
    
    if (role === 'user') {
        bubbleDiv.textContent = text;
    } else {
        try {
            const rawHtml = marked.parse(text);
            const safeHtml = DOMPurify.sanitize(rawHtml);
            bubbleDiv.innerHTML = safeHtml;
            
            bubbleDiv.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
                
                const wrapper = document.createElement('div');
                wrapper.className = 'code-wrapper';
                
                const header = document.createElement('div');
                header.className = 'code-header';
                header.innerHTML = `
                    <span>كود</span>
                    <button class="copy-btn" onclick="copyCode(this)">نسخ</button>
                `;
                
                const preElement = block.parentElement;
                preElement.parentElement.replaceChild(wrapper, preElement);
                wrapper.appendChild(header);
                wrapper.appendChild(preElement);
            });
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'msg-actions';
            actionsDiv.innerHTML = `
                <button class="msg-action-btn" onclick="copyMessage(this)">
                    <i class="fas fa-copy"></i> نسخ
                </button>
                <button class="msg-action-btn" onclick="speakMessage(this)">
                    <i class="fas fa-volume-up"></i> استماع
                </button>
            `;
            bubbleDiv.appendChild(actionsDiv);
            
        } catch (error) {
            console.error('خطأ في تحليل Markdown:', error);
            bubbleDiv.textContent = text;
        }
    }
    
    messageDiv.appendChild(bubbleDiv);
    elements.chatBox.appendChild(messageDiv);
    
    if (animate) {
        messageDiv.style.animation = 'fadeIn 0.3s ease';
    }
    
    scrollToBottom();
}

// ==================== تبديل إنشاء الصور ====================
function toggleImageGeneration() {
    state.imageGenerationEnabled = !state.imageGenerationEnabled;
    
    // حفظ الحالة
    localStorage.setItem('wgpt_image_enabled', state.imageGenerationEnabled);
    
    // تحديث مظهر الزر
    updateImageToggleButton();
    
    // عرض إشعار
    const status = state.imageGenerationEnabled ? 'مفعل' : 'معطل';
    const color = state.imageGenerationEnabled ? 'success' : 'error';
    const icon = state.imageGenerationEnabled ? 'fa-check' : 'fa-times';
    
    showNotification(`تم ${status} إنشاء الصور`, color);
    
    // إذا تم تعطيله وإذا كانت نافذة الصور مفتوحة، أغلقها
    if (!state.imageGenerationEnabled && elements.imageModal.classList.contains('active')) {
        hideImageModal();
    }
}

function updateImageToggleButton() {
    const btn = elements.toggleImageBtn;
    const icon = btn.querySelector('i');
    
    if (state.imageGenerationEnabled) {
        btn.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
        btn.style.borderColor = 'rgba(0, 255, 136, 0.3)';
        icon.style.color = 'var(--success-green)';
        icon.className = 'fas fa-camera';
        btn.title = 'تعطيل إنشاء الصور';
    } else {
        btn.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
        btn.style.borderColor = 'rgba(255, 68, 68, 0.3)';
        icon.style.color = 'var(--error-red)';
        icon.className = 'fas fa-camera-slash';
        btn.title = 'تفعيل إنشاء الصور';
    }
}

function showNotification(message, type) {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // إضافة الأنماط
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)'};
        border: 1px solid ${type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)'};
        color: ${type === 'success' ? 'var(--success-green)' : 'var(--error-red)'};
        padding: 12px 20px;
        border-radius: 10px;
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: fadeIn 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// ==================== إنشاء الصور ====================
function showImageModal() {
    if (!state.imageGenerationEnabled) {
        showNotification('إنشاء الصور معطل حالياً. قم بتفعيله أولاً.', 'error');
        return;
    }
    
    elements.imageModal.classList.add('active');
    elements.imagePrompt.focus();
}

function hideImageModal() {
    elements.imageModal.classList.remove('active');
    resetImageForm();
}

function resetImageForm() {
    elements.imagePrompt.value = '';
    elements.imageStatus.style.display = 'none';
    elements.imagePreview.style.display = 'none';
    elements.generateImageBtn.disabled = false;
    elements.generateImageBtn.innerHTML = '<i class="fas fa-magic"></i><span>إنشاء الصورة</span>';
}

async function handleGenerateImage() {
    const prompt = elements.imagePrompt.value.trim();
    
    if (!prompt) {
        showImageStatus('يرجى إدخال وصف للصورة', 'error');
        return;
    }
    
    elements.generateImageBtn.disabled = true;
    elements.generateImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>جاري الإنشاء...</span>';
    
    const size = elements.imageSize.value;
    const style = elements.imageStyle.value;
    const [width, height] = size.split('x').map(Number);
    
    try {
        const imageData = await generateImageAPI(prompt, width, height, style);
        
        if (imageData) {
            state.generatedImageData = imageData;
            elements.generatedImage.src = imageData.url;
            elements.imagePreview.style.display = 'block';
            showImageStatus('✅ تم إنشاء الصورة بنجاح', 'success');
            addImageMessage(prompt, imageData.url);
        }
    } catch (error) {
        console.error('خطأ في إنشاء الصورة:', error);
        showImageStatus(`❌ ${error.message || 'فشل في إنشاء الصورة'}`, 'error');
    } finally {
        elements.generateImageBtn.disabled = false;
        elements.generateImageBtn.innerHTML = '<i class="fas fa-magic"></i><span>إنشاء الصورة</span>';
    }
}

async function generateImageAPI(prompt, width, height, style) {
    let enhancedPrompt = prompt;
    
    switch(style) {
        case 'digital_art':
            enhancedPrompt += ", digital art, 8k, detailed, trending on artstation";
            break;
        case 'anime':
            enhancedPrompt += ", anime style, studio ghibli, makoto shinkai";
            break;
        case 'painting':
            enhancedPrompt += ", oil painting, masterpiece, brush strokes";
            break;
        default:
            enhancedPrompt += ", realistic, photorealistic, 8k, detailed";
    }
    
    try {
        const response = await fetch(CONFIG.IMAGE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: CONFIG.API_KEY,
                generate_image: true,
                image_prompt: enhancedPrompt,
                image_width: width,
                image_height: height,
                session_id: state.sessionId,
                user_id: state.username,
                license_key: state.licenseKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.image_url) {
            // استخدام CORS proxy للصور الخارجية
            const imageUrl = data.image_url.startsWith('http') ? 
                `https://corsproxy.io/?${encodeURIComponent(data.image_url)}` : 
                data.image_url;
            
            return {
                url: imageUrl,
                originalUrl: data.image_url,
                prompt: prompt,
                dimensions: { width, height },
                style: style
            };
        } else {
            throw new Error(data.error || 'فشل في إنشاء الصورة');
        }
        
    } catch (error) {
        console.error('خطأ في إنشاء الصورة:', error);
        throw error;
    }
}

function showImageStatus(message, type) {
    elements.imageStatus.textContent = message;
    elements.imageStatus.className = `image-status ${type}`;
    elements.imageStatus.style.display = 'block';
}

function downloadImage() {
    if (!state.generatedImageData) return;
    
    // إزالة الـ proxy إذا كان موجوداً
    const imageUrl = state.generatedImageData.originalUrl || state.generatedImageData.url;
    const cleanUrl = imageUrl.includes('corsproxy.io/?') ? 
        decodeURIComponent(imageUrl.split('corsproxy.io/?')[1]) : 
        imageUrl;
    
    const link = document.createElement('a');
    link.href = cleanUrl;
    link.download = `wormgpt_image_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function addImageMessage(prompt, imageUrl) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-bot';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'msg-bubble';
    
    bubbleDiv.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>📸 الصورة المنشأة:</strong>
            <p style="color: #888; margin-top: 5px;">${prompt}</p>
        </div>
        <div style="border-radius: 8px; overflow: hidden; margin: 10px 0;">
            <img src="${imageUrl}" alt="الصورة المنشأة" style="width: 100%; border-radius: 8px;">
        </div>
        <div class="msg-actions">
            <button class="msg-action-btn" onclick="window.open('${imageUrl}', '_blank')">
                <i class="fas fa-external-link-alt"></i> فتح
            </button>
            <button class="msg-action-btn" onclick="downloadImageFromChat('${imageUrl}')">
                <i class="fas fa-download"></i> تنزيل
            </button>
        </div>
    `;
    
    messageDiv.appendChild(bubbleDiv);
    elements.chatBox.appendChild(messageDiv);
    scrollToBottom();
    
    state.conversation.push({ 
        role: 'bot', 
        content: `صورة منشأة: ${prompt}`,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString() 
    });
    saveConversation();
}

// ==================== وظائف مساعدة ====================
function showLoading() {
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
        <div class="loading-dots">
            <div class="loading-dot" style="animation: bounce 1.4s infinite;"></div>
            <div class="loading-dot" style="animation: bounce 1.4s infinite 0.2s;"></div>
            <div class="loading-dot" style="animation: bounce 1.4s infinite 0.4s;"></div>
        </div>
        <span>جاري المعالجة...</span>
    `;
    elements.chatBox.appendChild(loadingDiv);
    scrollToBottom();
    return loadingId;
}

function removeLoading(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        element.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            if (element.parentElement) {
                element.remove();
            }
        }, 300);
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    elements.chatBox.appendChild(errorDiv);
    scrollToBottom();
    
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        elements.chatBox.scrollTo({
            top: elements.chatBox.scrollHeight,
            behavior: 'smooth'
        });
    });
}

function saveConversation() {
    if (state.conversation.length > 0) {
        localStorage.setItem('wgpt_conversation', JSON.stringify(state.conversation));
    }
}

function clearChat() {
    if (!confirm("هل أنت متأكد من رغبتك في مسح المحادثة؟")) return;
    
    state.conversation = [];
    state.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.removeItem('wgpt_conversation');
    
    elements.chatBox.innerHTML = `
        <div class="welcome-screen">
            <h1>كيف يمكنني مساعدتك سيدي؟</h1>
            <h2>مرحباً بك في WormGPT</h2>
            <div class="welcome-badge">
                <span>✨ إنشاء صور + محادثة ✨</span>
            </div>
        </div>
    `;
}

// ==================== إدخال صوتي ====================
function toggleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showError("الإدخال الصوتي غير مدعوم في متصفحك");
        return;
    }

    if (state.isRecording) {
        state.recognition.stop();
        return;
    }

    state.recognition = new SpeechRecognition();
    state.recognition.lang = 'ar-SA';
    state.recognition.continuous = false;
    state.recognition.interimResults = false;
    state.recognition.maxAlternatives = 1;

    state.recognition.onstart = () => {
        state.isRecording = true;
        elements.micBtn.classList.add('mic-active');
    };

    state.recognition.onend = () => {
        state.isRecording = false;
        elements.micBtn.classList.remove('mic-active');
    };

    state.recognition.onresult = (event) => {
        if (event.results && event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            elements.chatInput.value = transcript;
            handleInputChange();
        }
    };

    state.recognition.onerror = (event) => {
        console.error('خطأ في التعرف الصوتي:', event.error);
        state.isRecording = false;
        elements.micBtn.classList.remove('mic-active');
        
        let errorMsg = "فشل التعرف الصوتي.";
        if (event.error === 'not-allowed') {
            errorMsg = "تم رفض الوصول للميكروفون. يرجى السماح بالوصول في إعدادات المتصفح.";
        }
        
        showError(errorMsg);
    };

    try {
        state.recognition.start();
    } catch (error) {
        console.error('فشل بدء التعرف:', error);
        showError("فشل بدء التعرف الصوتي");
    }
}

// ==================== القائمة ====================
function toggleMenu() {
    elements.sideMenu.classList.toggle('active');
    elements.menuOverlay.classList.toggle('active');
    document.body.classList.toggle('blur-active');
}

function handleLogout() {
    if (!confirm("هل أنت متأكد من تسجيل الخروج؟")) return;
    
    localStorage.clear();
    state.username = '';
    state.conversation = [];
    state.isLicensed = false;
    state.imageGenerationEnabled = true;
    state.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    elements.loginModal.classList.remove('active');
    showLicenseModal();
    toggleMenu();
}

function updateConnectionStatus() {
    state.isConnected = navigator.onLine;
    if (!state.isConnected) {
        showError("أنت غير متصل بالإنترنت الآن");
    }
}

// ==================== وظائف عامة ====================
window.copyCode = function(btn) {
    const codeWrapper = btn.closest('.code-wrapper');
    const codeElement = codeWrapper.querySelector('code');
    
    if (!codeElement) return;
    
    const code = codeElement.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'تم النسخ!';
        btn.style.background = 'rgba(255, 51, 51, 0.3)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    });
};

window.copyMessage = function(btn) {
    const bubble = btn.closest('.msg-bubble');
    const clone = bubble.cloneNode(true);
    
    clone.querySelectorAll('.msg-actions, .code-header').forEach(el => el.remove());
    
    const text = clone.textContent.trim();
    
    navigator.clipboard.writeText(text).then(() => {
        const icon = btn.querySelector('i');
        if (icon) {
            const originalClass = icon.className;
            icon.className = 'fas fa-check';
            setTimeout(() => {
                icon.className = originalClass;
            }, 2000);
        }
    });
};

window.speakMessage = function(btn) {
    const bubble = btn.closest('.msg-bubble');
    const clone = bubble.cloneNode(true);
    
    clone.querySelectorAll('.msg-actions, .code-wrapper').forEach(el => el.remove());
    
    const text = clone.textContent.trim();

    if (!text) {
        showError("لا يوجد نص للقراءة");
        return;
    }

    if (!('speechSynthesis' in window)) {
        showError("القراءة النصية غير مدعومة في متصفحك");
        return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 1;

    btn.classList.add('playing');
    
    utterance.onend = () => {
        btn.classList.remove('playing');
    };
    
    utterance.onerror = () => {
        btn.classList.remove('playing');
        showError("فشل في قراءة النص");
    };

    synth.speak(utterance);
};

window.downloadImageFromChat = function(imageUrl) {
    // إزالة الـ proxy إذا كان موجوداً
    const cleanUrl = imageUrl.includes('corsproxy.io/?') ? 
        decodeURIComponent(imageUrl.split('corsproxy.io/?')[1]) : 
        imageUrl;
    
    const link = document.createElement('a');
    link.href = cleanUrl;
    link.download = `wormgpt_image_${Date.now()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// بدء التطبيق
document.addEventListener('DOMContentLoaded', initApp);