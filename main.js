document.addEventListener('DOMContentLoaded', () => {

    // --- STATE & ELEMENTS ---
    let isAutomating = false;
    let currentTypeInterval = null;
    let isMusicPlaying = false;
    let audioElement = null;

    const scenes = {
        lockbox: document.getElementById('lockboxContainer'),
        typing: document.getElementById('typingContainer'),
        notes: document.getElementById('notesApp'),
        instagram: document.getElementById('instagramDM'),
    };

    const codeInput = document.getElementById('codeInput');
    const errorMessage = document.getElementById('errorMessage');
    const noteTextElement = document.getElementById('noteText');

    // Music Player Elements
    const vinylPlayer = document.getElementById('vinylPlayer');
    const vinylFab = document.getElementById('vinylFab');
    const vinylStatusIcon = document.querySelector('.vinyl-status-icon');
    const vinylModal = document.getElementById('vinylModal');
    const playPauseBtn = document.getElementById('playPauseBtn');


    // --- CORE FUNCTIONS ---

    const delay = ms => new Promise(res => setTimeout(res, ms));

    const normalize = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const showScene = (sceneName) => {
        Object.values(scenes).forEach(s => s.classList.remove('active'));
        if (scenes[sceneName]) {
            scenes[sceneName].classList.add('active');
        }
        vinylPlayer.classList.toggle('ig-active', sceneName === 'instagram');
    };

    const lockInteractions = () => {
        isAutomating = true;
        document.body.classList.add('disable-interactions');
        noteTextElement.style.pointerEvents = 'none';
    };

    const unlockInteractions = () => {
        isAutomating = false;
        document.body.classList.remove('disable-interactions');
        noteTextElement.style.pointerEvents = 'auto';
    };


    // --- TYPING ANIMATION LOGIC ---

    const typeText = (element, text, interval = 50) => {
        return new Promise(resolve => {
            const isFormElement = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';
            if (isFormElement) element.value = '';
            else element.textContent = '';

            let i = 0;
            currentTypeInterval = setInterval(() => {
                if (i < text.length) {
                    if (isFormElement) {
                        element.value += text[i];
                    } else {
                        element.textContent += text[i];
                    }
                    i++;
                    if (isFormElement) {
                        element.scrollTop = element.scrollHeight;
                    }
                } else {
                    clearInterval(currentTypeInterval);
                    currentTypeInterval = null;
                    resolve();
                }
            }, interval);
        });
    };

    const eraseText = (element, interval = 25) => {
        return new Promise(resolve => {
            let text = element.textContent;
            currentTypeInterval = setInterval(() => {
                if (text.length > 0) {
                    text = text.slice(0, -1);
                    element.textContent = text;
                } else {
                    clearInterval(currentTypeInterval);
                    currentTypeInterval = null;
                    resolve();
                }
            }, interval);
        });
    };


    // --- MUSIC PLAYER LOGIC ---

    const initMusicPlayer = () => {
        document.getElementById('songTitle').textContent = 'Thuy Trieu';
        document.getElementById('songArtist').textContent = 'Quang Hung MasterD';
        audioElement = new Audio('./ThuỷTriều.mp3'); // Ensure this path is correct
        audioElement.loop = true;
        audioElement.volume = 0.6;

        vinylFab.addEventListener('click', () => {
            if (!vinylModal.classList.contains('show')) {
                 vinylModal.classList.add('show');
            }
        });
        document.getElementById('closeModalBtn').addEventListener('click', () => vinylModal.classList.remove('show'));
        playPauseBtn.addEventListener('click', toggleMusic);
        vinylModal.addEventListener('click', (e) => {
            if (e.target === vinylModal) {
                vinylModal.classList.remove('show');
            }
        });
    };

    const toggleMusic = () => {
        if (isMusicPlaying) {
            audioElement.pause();
            playPauseBtn.textContent = '▶️';
            vinylStatusIcon.textContent = '▶️';
            vinylFab.classList.remove('playing');
        } else {
            audioElement.play().catch(e => console.error("Audio play failed:", e));
            playPauseBtn.textContent = '⏸️';
            vinylStatusIcon.textContent = '⏸️';
            vinylFab.classList.add('playing');
        }
        isMusicPlaying = !isMusicPlaying;
    };


    // --- MAIN APPLICATION FLOW ---

    const checkCode = async () => {
        if (isAutomating) return;
        const code = normalize(codeInput.value);

        if (code === 'trai tim' || code === 'heart') {
            await unlockSequence();
        } else {
            errorMessage.classList.add('show');
            codeInput.value = '';
            setTimeout(() => errorMessage.classList.remove('show'), 2000);
        }
    };
    
    const unlockSequence = async () => {
        lockInteractions();
        
        scenes.lockbox.classList.add('exiting');
        await delay(600);
        showScene('typing');

        if (!isMusicPlaying) {
            toggleMusic();
        }
        vinylPlayer.style.display = 'block';

        // ✨ CHANGE: The element is now the container div, not a separate span
        const typedElement = document.getElementById('typingText');
        const introMessages = [
            "Hello Phuong, I hope you enjoyed your birthday.",
            "This was supposed to be the last of my gifts...",
            "but this one is a bit selfish, as it's really for me.",
            "Please sit back and relax as I write out some of my thoughts."
        ];
        
        // ✨ CHANGE: Add 'typing' class to the text container to enable the CSS cursor
        typedElement.parentElement.classList.add('typing');

        for (const message of introMessages) {
            await typeText(typedElement, message, 40);
            await delay(2000);
            if (message !== introMessages[introMessages.length - 1]) {
               await eraseText(typedElement, 20);
               await delay(500);
            }
        }
        
        // ✨ CHANGE: Remove the 'typing' class to hide the cursor
        typedElement.parentElement.classList.remove('typing');
        await delay(1000);

        showScene('notes');
        document.getElementById('noteDate').textContent = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
        await delay(500);
        await startTypingLetter();

        await delay(3000);
        showScene('instagram');
        await startInstagramSequence();
        
        unlockInteractions();
    };

    const startTypingLetter = async () => {
        // ✨ CHANGE: All cursor logic has been removed from this function for a cleaner effect.
        const letterContent = `Dear Phuong,

I've been sitting here trying to find the right words to express everything I've been feeling, and honestly, I'm not sure I'll ever find them all.

[This is where your beautiful, heartfelt letter will go. You can write as much as you want here. The text box will scroll automatically as you add more content to this string.]

I wanted to create something special for you, something that was more than just a gift, but a small world for just a moment. I hope you liked it.

With all my affection,
Sammy A.`;

        await typeText(noteTextElement, letterContent, 35);
    };

    const startInstagramSequence = async () => {
        const chatContainer = document.getElementById('igChatContainer');
        const messages = [
            "I wanted to give you a space to share your thoughts, if you want to.",
            "No pressure at all, but I'd love to hear what you're thinking when you're ready ✨"
        ];
        
        for (const msg of messages) {
            await delay(1200);
            const messageDiv = document.createElement('div');
            messageDiv.className = 'ig-message received';
            messageDiv.innerHTML = `<div class="ig-message-bubble">${msg}</div>`;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        document.getElementById('notesBackBtn').style.visibility = 'visible';
        setupInstagramInput();
    };

    const setupInstagramInput = () => {
        const messageInput = document.getElementById('igMessageInput');
        const sendButton = document.getElementById('igSendButton');
        const chatContainer = document.getElementById('igChatContainer');

        const updateSendButton = () => {
            sendButton.classList.toggle('disabled', messageInput.value.trim() === '');
        };

        const sendMessage = () => {
            const text = messageInput.value.trim();
            if (!text) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = 'ig-message sent';
            messageDiv.innerHTML = `<div class="ig-message-bubble">${text}</div>`;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            messageInput.value = '';
            updateSendButton();
        };

        messageInput.addEventListener('input', updateSendButton);
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
        
        updateSendButton();
        messageInput.focus();
    };


    // --- NAVIGATION ---

    const goBackToLetter = () => {
        if(isAutomating) return;
        showScene('notes');
    };

    const goBackToInstagram = () => {
        if(isAutomating) return;
        showScene('instagram');
        document.getElementById('igMessageInput').focus();
    };


    // --- INITIALIZATION ---

    const init = () => {
        window.checkCode = checkCode;
        window.goBackToLetter = goBackToLetter;
        window.goBackToInstagram = goBackToInstagram;
        
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = `${Math.random() * 100}%`;
            p.style.animationDelay = `${Math.random() * 25}s`;
            p.style.animationDuration = `${Math.random() * 15 + 15}s`;
            particlesContainer.appendChild(p);
        }

        codeInput.addEventListener('keypress', (e) => e.key === 'Enter' && checkCode());

        initMusicPlayer();
        showScene('lockbox');
        codeInput.focus();
    };

    init();
});