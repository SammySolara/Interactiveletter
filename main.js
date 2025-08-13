document.addEventListener('DOMContentLoaded', () => {

    async function logEvent(eventType, details = {}) {
    const deviceInfo = navigator.userAgent;

    const { error } = await window.supabase
        .from('alerts')
        .insert([{
            event_type: eventType,
            details,
            user_agent: deviceInfo
        }]);

    if (error) console.error("Supabase log error:", error);
}


    let isAutomating = false;
    let isMusicPlaying = false;
    let audioElement = null;
    const unlockSound = new Audio('./unlock.mp3');
    unlockSound.preload = 'auto';
    unlockSound.load();
    const errorSound = new Audio('./error.mp3');
    errorSound.preload = 'auto';
    errorSound.load();
    unlockSound.volume = 0.8;
    errorSound.volume = 0.3;

    const scenes = {
        lockbox: document.getElementById('lockboxContainer'),
        typing: document.getElementById('typingContainer'),
        notes: document.getElementById('notesApp'),
        instagram: document.getElementById('instagramDM'),
    };

    const codeInput = document.getElementById('codeInput');
    const errorMessage = document.getElementById('errorMessage');
    const noteTextElement = document.getElementById('noteText');

    const vinylPlayer = document.getElementById('vinylPlayer');
    const vinylFab = document.getElementById('vinylFab');
    const vinylStatusIcon = document.querySelector('.vinyl-status-icon');
    const vinylModal = document.getElementById('vinylModal');
    const playPauseBtn = document.getElementById('playPauseBtn');


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

    const typeText = (element, text, baseInterval = 50) => {
        return new Promise(resolve => {
            const isFormElement = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';

            let i = 0;
            const typeCharacter = () => {
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
                    const variation = Math.random() * 60 - 30; 
                    const nextInterval = Math.max(10, baseInterval + variation);
                    
                    currentTypeInterval = setTimeout(typeCharacter, nextInterval);
                } else {
                    currentTypeInterval = null;
                    resolve();
                }
            };
            
            typeCharacter();
        });
    };
    
    const backspace = (element, count, baseInterval = 25) => {
        return new Promise(resolve => {
            const isFormElement = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';
            let i = 0;
            const backspaceCharacter = () => {
                if (i < count) {
                    const currentText = isFormElement ? element.value : element.textContent;
                    if (currentText.length > 0) {
                        if (isFormElement) {
                            element.value = currentText.slice(0, -1);
                        } else {
                            element.textContent = currentText.slice(0, -1);
                        }
                        i++;
                        if (isFormElement) {
                            element.scrollTop = element.scrollHeight;
                        }
                        const variation = Math.random() * 40 - 20; variation
                        const nextInterval = Math.max(5, baseInterval + variation);
                        
                        setTimeout(backspaceCharacter, nextInterval);
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            };
            
            backspaceCharacter();
        });
    };

    const typeHesitantly = async (element, script) => {
        
        element.focus();

        for (const step of script) {
            const hesitation = Math.random() * 200 + 50;
            await delay(hesitation);
            
            switch (step.action) {
                case 'type':
                    await typeText(element, step.text, step.speed || 80);
                    break;
                case 'pause':
                    const pauseVariation = Math.random() * 0.4 + 0.8;
                    await delay(step.duration * pauseVariation);
                    break;
                case 'backspace':
                    await backspace(element, step.count, step.speed || 40);
                    break;
            }
        }
    };

    const initMusicPlayer = () => {
        document.getElementById('songTitle').textContent = 'Thuy Trieu';
        document.getElementById('songArtist').textContent = 'Quang Hung MasterD';
        audioElement = new Audio('./ThuỷTriều.mp3');
        audioElement.loop = true;
        audioElement.volume = 0;
        vinylFab.addEventListener('click', toggleMusic);
    }; 

    const toggleMusic = () => {
        if (isMusicPlaying) {
            audioElement.pause();
            playPauseBtn.textContent = '▶️';
            vinylStatusIcon.textContent = '▶️';
            vinylFab.classList.remove('playing');
        } else {
            fadeInMusic();
        }
        isMusicPlaying = !isMusicPlaying;
    };

    const fadeInMusic = () => {
        audioElement.volume = 0;
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(e => console.error("Audio play failed:", e));
        }
        
        playPauseBtn.textContent = '⏸️';
        vinylStatusIcon.textContent = '⏸️';
        vinylFab.classList.add('playing');
        const targetVolume = 0.1;
        const fadeStep = targetVolume / 100;
        const fadeInterval = 50;
        let currentVolume = 0;
        
        const fadeAudio = setInterval(() => {
            currentVolume += fadeStep;
            if (currentVolume < targetVolume) {
                audioElement.volume = currentVolume;
            } else {
                audioElement.volume = targetVolume;
                clearInterval(fadeAudio);
            }
        }, fadeInterval);
    };


    const checkCode = async () => {
        if (isAutomating) return;
        const code = normalize(codeInput.value);

        if (code === 'trai tim' || code === 'heart') {
            unlockSound.play().catch(() => {});
            await logEvent('unlock_successful', { codeUsed: code});
            await unlockSequence();
        } else {
            errorSound.play().catch(() => {});
            await logEvent('unlock_failed', { codeUsed: code});
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
        await logEvent('sequence_progress', { stage: 'unlock_typing_screen' });

        if (!isMusicPlaying) {
            toggleMusic();
        }
        vinylPlayer.style.display = 'block';

        const typedElement = document.getElementById('typingText');
        const introMessages = [
            "Phương nè…",
            "Anh hy vọng hôm nay em được bao quanh bởi những người em yêu và những người làm em cảm thấy được yêu trở lại.",
            "Anh thích tưởng tượng rằng em đã nhận được tất cả những gì em mong muốn — và hơn thế nữa.",
            "Việc chọn món quà đúng cho em thật sự không dễ chút nào.",
            "Cuối cùng, anh chọn một thứ để em có thể dùng mỗi ngày — khi học, khi chơi game — thứ mà em có thể tùy chỉnh bất cứ lúc nào nếu một ngày muốn đổi mới.",
            "Anh nhớ từ rất lâu trước đây, em từng nói muốn anh ráp cho em một cái bàn phím. Vậy nên… đây là nó. Anh mong nó mang lại cho em nhiều niềm vui như khi anh lắp từng phím, từng ốc vít.",
            "Anh cố tình chọn một bộ kit thật dễ để em có thể thay đổi mọi thứ một cách đơn giản, nếu em muốn.",
            "Nhưng đó không phải là món quà duy nhất anh từng nghĩ đến.",
            "Anh sợ nếu làm quá nhiều, nó sẽ thành gượng gạo… hoặc mất đi sự tự nhiên. Nên anh giữ mọi thứ lại, để vừa đủ.",
            "Anh cũng muốn viết vài lời để động viên em… nhưng lại sợ, nếu em đã mệt mỏi vì nghe anh nói, thì nó sẽ trở thành gánh nặng.",
            "Vậy nên, anh để nó trong một cuốn sách.",
            "Một cuốn sách đã thay đổi cách anh sống. Anh cố tình đặt mã mở khóa dựa trên một điều trong đó — để nếu em tìm ra, là vì chính sự tò mò và những gì em học được đã dẫn em đến đây, chứ không phải vì anh ép em phải đọc lá thư này.",
            "Nếu em đang đọc những dòng này… thì anh đã đúng khi tin rằng em sẽ tự tìm đến.",
            "Nhưng mà… vài câu chữ in trên giấy sẽ quá đơn giản với một người như anh. Anh vốn dĩ đã quen sống hơi ‘quá tay’ một chút, nên mong em tha thứ.",
            "Anh nghĩ… thay vì chỉ đọc lời anh viết, sao em không nhìn thấy chúng được tạo ra ngay trước mắt mình?",
            "Không gì thân mật hơn việc được ở bên trong suy nghĩ của ai đó khi họ nghĩ về mình.",
            "Vậy nên, nếu em đồng ý, anh sẽ viết cho em một lá thư — và nếu ở lại tới cuối, sẽ có một bất ngờ đang đợi.",
            "Sẽ mất một chút thời gian… nên hãy tìm một chỗ yên tĩnh, riêng tư, thoải mái để đọc những gì anh đã cất trong lòng bấy lâu.",
            "Trang web này đang bật cho em một bài hát nền — bài mà từ lâu em từng nói là thích. Anh đã giữ lại tên nó… phòng khi cần đến, và hôm nay chính là lúc đó.",
            "Nếu muốn, em có thể tắt nhạc bằng cách bấm vào chiếc đĩa than ở góc dưới bên phải."
        ];
        typedElement.parentElement.classList.add('typing');

        for (const message of introMessages) {
            await typeText(typedElement, message, 60);
            await delay(3000);
            if (message !== introMessages[introMessages.length - 1]) {
               await eraseText(typedElement, 20);
               await delay(500);
            }
        }
        
        typedElement.parentElement.classList.remove('typing');
        await delay(1000);

        showScene('notes');
        await logEvent('sequence_progress', { stage: 'notes_screen' });
        document.getElementById('noteDate').textContent = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
        await delay(500);
        await startTypingLetter();

        await delay(4000);
        showScene('instagram');
        await logEvent('sequence_progress', { stage: 'instagram_screen' });
        await startInstagramSequence();
        
        unlockInteractions();
    };

const letterScript = [
    { action: "type", text: "Chúc mừng sinh nhật Phương!", "speed": 80 },
    { action: 'pause', duration: 400 },
    { action: 'type', text: '\nAnh mong hôm nay là một ngày thật đặc biệt với em.', speed: 90 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\n\nThiệt tình anh cũng chẳng biết người ta thường làm gì trong ngày sinh nhật—', speed: 85 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: '\nanh thì… có bao giờ mừng sinh nhật mình đâu.', speed: 100 },
    { action: 'type', text: ' cũng chẳng cần thiết', speed: 80 },
    { action: 'pause', duration: 700 },
    { action: 'backspace', count: 21, speed: 30 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\n\nDù gì thì, anh muốn viết cho em một lá thư.', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nTại mình cũng đâu nhắn tin nhiều như trước nữa.', speed: 90 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nAnh thấy đây là phần ý nghĩa nhất trong món quà\nmà có thể tồn tại mãi với thời gian.', speed: 75 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nAnh thật sự muốn nói nhiều lắm—', speed: 80 },
    { action: 'type', text: ' quá nhiều, thật ra', speed: 90 },
    { action: 'pause', duration: 600 },
    { action: 'backspace', count: 19, speed: 30 },
    { action: 'pause', duration: 1300 },
    { action: 'type', text: '\nvì dù nhìn vô chắc em tưởng anh nói hết rồi,\nnhưng những gì anh từng nói chắc chưa tới một phần trăm\ncủa mớ suy nghĩ đã lướt ngang qua đầu anh.', speed: 90 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\n\nAnh sẽ bắt đầu bằng một lời cảm ơn.', speed: 80 },
    { action: 'pause', duration: 1000 },
    { action: 'type', text: ' Vì nhiều lý do lắm.', speed: 90 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nMột trong số đó là:\nem từng là một trong những nguồn vui chính\ncủa anh hồi anh mới đặt chân tới Việt Nam.', speed: 85 },
    { action: 'type', text: ' và vẫn là', speed: 100 },
    { action: 'pause', duration: 800 },
    { action: 'backspace', count: 9, speed: 30 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nLúc đó anh thấy mình hơi ngợp và lạc lõng—', speed: 90 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: '\nmà nói thật,\ntrước khi đến đây,\nanh cũng trải qua khá nhiều chuyện,\nchỉ là anh ít khi kể ra thôi.', speed: 95 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\n\nAnh thấy việc hỏi han chuyện người khác\nlúc nào cũng thú vị hơn\nlà ngồi đào sâu vô mớ rối của mình.', speed: 80 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nMà chuyện đó,\nvừa là phước,\nvừa là nghiệp...', speed: 110 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nMột mặt, anh có thể nói chuyện với gần như bất kỳ ai,\nhiểu họ sâu,\nnhớ rõ mấy thứ họ thích,\nvà hòa nhập được.', speed: 85 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nMặt khác,\nnó biến anh thành một bức tranh vá chằng vá đụp\ntừ từng người mà anh từng thấy dễ gần, dễ mến—', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'backspace', count: 51, speed: 30 },
    { action: 'pause', duration: 1000 },
    { action: 'type', text: '\nghép từ từng người anh từng thấy dễ gần, dễ mến—', speed: 75 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: '\ntới mức, anh dần quên mất:\nphần nào mới thật sự là của riêng mình.', speed: 90 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nNó khiến anh trở thành một người bán hàng tuyệt vời,\nmột cuốn sách sống động viết bằng những người quanh anh,\nnhưng lại là kẻ tệ hại nhất khi phải chăm sóc chính bản thân mình.', speed: 85 },
    { action: 'pause', duration: 3500 },
    { action: 'type', text: '\n\nNhưng những lúc được ở bên em thật sự đặc biệt.', speed: 80 },
    { action: 'type', text: ' hiếm hoi lắm', speed: 90 },
    { action: 'pause', duration: 700 },
    { action: 'backspace', count: 13, speed: 30 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nEm có cái kiểu nhẹ nhàng, thoáng đãng\nkhiến người ta thấy thoải mái, dễ chịu lạ thường.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nChỉ cần nhìn em một cái\nlà mọi muộn phiền tự nhiên tan biến.', speed: 85 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nNụ cười của em—', speed: 100 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: '\nsáng đến mức có thể thắp sáng cả căn phòng.', speed: 80 },
    { action: 'type', text: '\nlúc này, anh lại thấy nó', speed: 80 },
    { action: 'pause', duration: 800 },
    { action: 'backspace', count: 24, speed: 30 },
    { action: 'pause', duration: 2200 },
    { action: 'type', text: '\nLúc em gọi cho anh với cái filter ngớ ngẩn đó—\nthì mọi thứ đang xảy ra xung quanh\ncũng chẳng còn quan trọng gì nữa.', speed: 90 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\nBao nhiêu suy nghĩ, lo toan trong đầu\nbỗng tan biến như khói bay trong nắng sớm.', speed: 85 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nAnh mới có thể thật sự cảm thấy yên lòng.', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: ' Bình yên với người như anh—\nkhó kiếm lắm.', speed: 90 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\n\nLúc nào đầu óc cũng chạy theo chuyện kế tiếp,\nviệc kế tiếp, mục tiêu kế tiếp…', speed: 100 },
    { action: 'pause', duration: 1800 },
    { action: 'type', text: '\nAnh cứ rượt theo sự thật, rượt theo cái mới,\ncứ tưởng chỉ cần vậy là đủ để gọi đó là “nhà”.', speed: 85 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nNhưng cuối cùng,\nchính anh lại biến cái gọi là “nhà” đó\nthành cái lồng mà anh chỉ muốn trốn khỏi.', speed: 90 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\nChắc là… thật ra anh sợ sự bình yên, sợ cái cảm giác đứng yên một chỗ.', speed: 95 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nNhưng lúc ở bên em—nó lại khác.', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: ' Lần đầu tiên,\nbình yên không còn là thứ anh muốn chạy trốn,\nmà là thứ anh muốn đắm chìm trong đó,\nmuốn được ôm trọn lấy.', speed: 85 },
    { action: 'pause', duration: 3500 },
    { action: 'type', text: '\n\nEm cũng nhắc anh nhớ lại một điều quan trọng lắm—', speed: 80 },
    { action: 'pause', duration: 1300 },
    { action: 'type', text: '\nmột điều anh biết rõ,\nmà anh cố tình quên, hoặc giả vờ không thấy.', speed: 90 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\nEm nhắc anh rằng,\nkhi thật lòng thương một người,\nđâu phải để sở hữu.', speed: 85 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nKhông phải cố giữ lại,\ncũng không phải ráng níu cho bằng được.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nCó những thứ, giống như hoa,\nchỉ sinh ra để người ta ngắm nhìn—\nchứ đâu phải để hiểu.', speed: 80 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\nTim anh thì lại không hiểu chuyện đó.', speed: 100 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: ' Lỡ thương em...', speed: 120 },
    { action: 'pause', duration: 1000 },
    { action: 'backspace', count: 11, speed: 50 },
    { action: 'pause', duration: 800 },
    { action: 'type', text: 'Lỡ thương em\ngiống như nhìn một bông hoa\nnở rộ trong khu vườn\nmà anh không bao giờ được bước vào.', speed: 85 },
    { action: 'pause', duration: 3500 },
    { action: 'type', text: '\n\nAnh biết là ngu mà—', speed: 90 },
    { action: 'pause', duration: 1000 },
    { action: 'type', text: '\nít ra, cái đầu anh biết rõ.', speed: 100 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nNhưng tiếc là,\ntrái tim mới là thứ quyết định mình chọn gì.', speed: 90 },
    { action: 'pause', duration: 1800 },
    { action: 'type', text: ' Nó chọn em,\ndù em đâu có chọn lại.', speed: 100 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nBất công chứ.', speed: 110 },
    { action: 'pause', duration: 800 },
    { action: 'type', text: ' Nhưng mà—\ntình cảm xưa giờ, có khi nào công bằng đâu?', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nNgười ta ngây thơ lắm mới nghĩ là nó phải công bằng.', speed: 85 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: ' Tình cảm—chỉ để cảm,\nchứ đâu phải để hiểu.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nNó có cần hợp lý đâu.', speed: 100 },
    { action: 'pause', duration: 1000 },
    { action: 'type', text: ' Mà nó cũng chưa từng đòi hỏi như vậy.', speed: 90 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nEm cũng hay nhắc anh hoài\nlà đừng có suy nghĩ nhiều quá.', speed: 85 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nMà đúng thiệt,\ngiờ anh vẫn suy nghĩ nhiều lắm—', speed: 90 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: '\nnhưng anh cũng bắt đầu cho phép mình\nnghĩ ít lại,\nvà cảm nhiều hơn.', speed: 85 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nMà đó mới là mấy chuyện cảm xúc thôi.', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nEm còn dạy anh mấy thứ nhỏ nhỏ nữa—\nnhư là lúc gắp đồ ăn từ dĩa chung,\nphải dùng đầu đũa ngược để gắp qua chén mình,\nrồi mới lật lại để ăn.', speed: 90 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\n\n(This one still makes me laugh because I didn\'t believe you for some reason haha)', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\n\nCảm ơn em nha, Phương.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nAnh thấy mình hên lắm mới tình cờ gặp được em.', speed: 80 },
    { action: 'pause', duration: 1000 },
    { action: 'type', text: ' Thật sự.', speed: 120 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nMình có nhiều kỷ niệm vui ghê—', speed: 90 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: '\nmặc dù phần lớn chắc là em đập anh lia lịa,\nmà chắc anh cũng đáng bị vậy\nvì cứ chọc em nhìn lên nhìn xuống,\nrồi thừa lúc đó… gõ nhẹ vô mũi em.', speed: 95 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nHay cái lần em bắt anh cõng em\nlên mấy tầng lầu.', speed: 85 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nHay lúc anh ngồi đó khóc vì mì cay\nmà em vẫn lo cho anh.', speed: 90 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nCái lần em xoa ngay giữa trán anh\nmạnh tới mức để lại dấu—làm anh nhìn y chang người Ấn—haha.', speed: 95 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nAnh bệnh muốn xỉu\nmà vẫn muốn ở cạnh em\nhơn là nằm trong giường của chính mình.', speed: 85 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\nTrời ơi, nghe điên ghê hông?', speed: 100 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: '\nHay khi em bệnh\nanh đem cái bịch quà chăm sóc qua cho em.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nMấy chuyện đó,\nanh biết chắc sẽ không bao giờ quên được.', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: ' Và chắc phải mang nó theo anh hoài luôn.', speed: 90 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nCó lần em nói với anh:\n“Tôi chỉ nói thôi lỡ bạn mê tôi quá bạn lại kiếm tôi.”', speed: 85 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\nĐúng là đồ đáng ghét.', speed: 100 },
    { action: 'pause', duration: 1000 },
    { action: 'type', text: ' Mà em nói đúng thiệt.', speed: 90 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: ' Anh ghét cái đó lắm.', speed: 110 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\n\nKhông có tháng nào, tuần nào, hay ngày nào trôi qua\nmà em—', speed: 85 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\nhay cái ly matcha freeze đáng ghét đó\nít đường, nhiều kem—\nkhông lởn vởn trong đầu anh.', speed: 95 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nNói thiệt, anh đâu có mê matcha dữ vậy đâu.', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nMà lâu lâu vẫn thấy muốn gọi,\nchỉ để nhớ lại mấy lần mua cho em.', speed: 90 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\n\nAnh cứ tự hỏi hoài\nkhông biết em có ổn không,\ncó vui không,\ncó ai lo cho em chưa.', speed: 95 },
    { action: 'type', text: ' mỗi ngày', speed: 90 },
    { action: 'pause', duration: 600 },
    { action: 'backspace', count: 9, speed: 30 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nAnh muốn biết em có ăn uống đàng hoàng không,\nchứ không phải theo cái chế độ ăn kiêng vớ vẩn mà em đâu có cần.', speed: 85 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nAnh biết… mấy chuyện đó đâu phải việc của anh—', speed: 90 },
    { action: 'pause', duration: 1300 },
    { action: 'type', text: '\nmà không hiểu sao, vẫn thấy muốn hỏi.', speed: 100 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nLúc trước anh còn thấy mắc cỡ vì chuyện đó,\nnhư thể mình đang phí tình cảm vậy.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nRồi anh mới hiểu ra,\nmình thương ai,\nthì đâu cần ai cho phép mới được thương.', speed: 85 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nNói vậy để em hiểu là—', speed: 80 },
    { action: 'pause', duration: 1000 },
    { action: 'type', text: '\ný anh chỉ đơn giản:\nchỉ cần em hạnh phúc,\nthì anh cũng thấy đủ rồi.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nDù điều đó có nghĩa là em sẽ ghét anh\nvì mấy hành động ngốc nghếch mà không được đáp lại.', speed: 85 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nDù sau này em có muốn\ncho anh góp mặt trong niềm vui đó hay không—\nthì cũng chẳng sao hết.', speed: 90 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nVì tình cảm này là vô điều kiện.', speed: 80 },
    { action: 'type', text: ' dù đau', speed: 100 },
    { action: 'pause', duration: 700 },
    { action: 'backspace', count: 7, speed: 30 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: ' Một sự quan tâm không đòi hỏi gì hết—\nchỉ đơn thuần là trân trọng cái gì từng quý với em.', speed: 85 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nChỉ cần hứa với anh mấy điều này:\nLuôn luôn đặt sự tôn trọng bản thân lên trước.', speed: 80 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nNếu chuyện gì đó không còn phù hợp với em nữa,\nthì hãy đủ dũng cảm và mạnh mẽ để thay đổi nó.', speed: 85 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\nNếu một ngày nào đó, thế giới trở nên quá tối hay quá nặng nề với em—', speed: 90 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\ndù chắc là em sẽ không tìm đến đâu—', speed: 95 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nem vẫn luôn có thể tìm thấy anh.', speed: 90 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\n\nAnh sẽ là mặt trời của em,\nvừa soi sáng,\nvừa làm nhẹ bớt gánh nặng trong ngày của em.', speed: 85 },
    { action: 'pause', duration: 3500 },
    { action: 'type', text: '\n\nGiờ thì em biết rõ em từng có ý nghĩa như thế nào với anh,\ndù em chưa bao giờ đòi hỏi điều đó.', speed: 80 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nCòn nếu sau này anh không còn được xuất hiện trong câu chuyện của em nữa—', speed: 85 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nthì anh cần điều cuối cùng anh làm cho em\nlà nói ra hết cảm xúc thật của mình.', speed: 90 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\nĐể lỡ như một ngày nào đó,\ncả thế giới có quay lưng với em—\nthì em vẫn sẽ biết\nlúc nào cũng có ít nhất một người ngoài kia\nluôn trân trọng và ngưỡng mộ em.', speed: 85 },
    { action: 'pause', duration: 4000 },
    { action: 'type', text: '\n\nĐiều anh thật sự tiếc nhất,\nlà chưa từng được nấu cho em món steak mà anh hứa.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nBiết đâu một ngày nào đó.', speed: 100 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: ' Có thể sẽ không phải là steak,\nmà là một món nào đó\ntrong cuốn sách nấu ăn anh tặng em dịp Giáng Sinh—', speed: 90 },
    { action: 'pause', duration: 1200 },
    { action: 'type', text: '\nhaha, nếu mà em còn giữ nó.', speed: 100 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\n\nÀ mà, cảm ơn em vì hồi đó\nđã cho ý kiến của anh có chút trọng lượng trong thế giới của em.', speed: 85 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\nAnh nhớ em từng nói\nem luôn muốn cãi nhau với anh bằng tiếng Việt\nvì thấy dễ hơn cho em.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nTiếc là\ntụi mình chưa từng có dịp làm vậy.', speed: 95 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\n(Mà chắc là em đã “ăn tươi nuốt sống” anh rồi—', speed: 85 },
    { action: 'pause', duration: 1000 },
    { action: 'type', text: '\nnói nhanh, dằn từng chữ,\nanh chưa kịp hiểu gì là thua chắc.)', speed: 90 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: '\n\nGiờ thì mấy cảm xúc cũng trút hết ra rồi—', speed: 80 },
    { action: 'pause', duration: 1300 },
    { action: 'type', text: '\nanh mong là em thích mấy món quà khác anh tặng.', speed: 90 },
    { action: 'pause', duration: 2800 },
    { action: 'type', text: '\nHoa thì ai cũng có thể tặng.', speed: 90 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: ' Nhưng không phải ai cũng tạo được một trải nghiệm có cảm xúc.', speed: 85 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nTrong cái trải nghiệm này,\nanh đã gỡ ra một mảnh thật của chính mình—\nvà để nó lại đây.', speed: 80 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\nĐể nếu một ngày nào đó,\nmột trong hai đứa muốn quay lại,\nthì phần đó của anh… vẫn sẽ luôn ở đó, chờ sẵn.', speed: 90 },
    { action: 'pause', duration: 3500 },
    { action: 'type', text: '\n\nVà nhớ nha—\n“Khi bạn khao khát một điều gì đó, cả vũ trụ sẽ hợp lực giúp bạn đạt được điều đó.”', speed: 85 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\nAnh không chỉ đọc câu đó—\nmà anh đã sống với nó.', speed: 90 },
    { action: 'pause', duration: 2500 },
    { action: 'type', text: '\nVì bất chấp mọi thứ,\nanh vẫn đã gặp được em.', speed: 95 },
    { action: 'pause', duration: 3500 },
    { action: 'type', text: '\n\nĐây có lẽ sẽ là một trong những hành động yêu thương cuối cùng', speed: 80 },
    { action: 'type', text: ' khó thật đấy', speed: 90 },
    { action: 'pause', duration: 700 },
    { action: 'backspace', count: 13, speed: 30 },
    { action: 'type', text: ' anh làm cho em—', speed: 80 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nkhông phải vì anh không muốn làm gì nữa,\nmà là để em có thể bay thật xa, thật tự do.', speed: 85 },
    { action: 'pause', duration: 3000 },
    { action: 'type', text: '\n\nNói vậy nghĩa là\ncó lẽ anh sẽ không chủ động liên lạc với em nữa', speed: 90 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nanh cũng không chắc giữ nổi lời hứa đó đâu', speed: 70 },
    { action: 'pause', duration: 1500 },
    { action: 'type', text: '\nnhưng nếu em nhắn,\nanh sẽ luôn trả lời.', speed: 100 },
    { action: 'pause', duration: 4000 },
    { action: "type", text: '\n\nTrước khi kết thúc,\n\nanh muốn nói với em\nlà tiếng Việt của em đẹp vô cùng.\nCó mấy điều\n\nnó diễn tả được\n\nmà tiếng Anh chịu thua.', speed: 110 },
    { action: "pause", "duration": 2000 },
    { action: 'type', text: 'Từ anh thích nhất\n\nlà thương —\n\ncái tình muốn ôm hết nỗi buồn,\n\nnỗi đau của người mình thương,\n\ngánh giùm để họ khỏi phải chịu.', speed: 100 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: 'Cái tình đó\n\nanh lúc nào cũng có…\n\nchỉ là trước giờ\n\nchưa biết gọi tên.', speed: 90 },
    { action: 'pause', duration: 2000 },
    { action: 'type', text: 'Vậy nên, thêm một lần nữa —\n\nsinh nhật vui vẻ nha, Phương.\n\nAnh thương em.', speed: 85 }
];

    const startTypingLetter = async () => {
        await typeHesitantly(noteTextElement, letterScript);
    };

    const eraseText = (element, baseInterval = 25) => {
        return new Promise(resolve => {
            const isFormElement = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';
            const eraseCharacter = () => {
                const currentText = isFormElement ? element.value : element.textContent;
                
                if (currentText.length > 0) {
                    if (isFormElement) {
                        element.value = currentText.slice(0, -1);
                    } else {
                        element.textContent = currentText.slice(0, -1);
                    }
                    if (isFormElement) {
                        element.scrollTop = element.scrollHeight;
                    }
                    const variation = Math.random() * 40 - 20;
                    const nextInterval = Math.max(5, baseInterval + variation);
                    
                    currentTypeInterval = setTimeout(eraseCharacter, nextInterval);
                } else {
                    currentTypeInterval = null;
                    resolve();
                }
            };
            
            eraseCharacter();
        });
    };

    const startInstagramSequence = async () => {
        const chatContainer = document.getElementById('igChatContainer');
        const messages = [
            "Giờ thì em đã nhìn thấy bên trong tâm trí anh rồi, Không gian này là của em",
            "Hét ra. Giận dữ. Ghét anh. Yêu anh. Nói gì cũng được – Chỉ có em thấy thôi",
            "Tin anh đi, anh sẽ muốn đọc từng chữ nếu có thể. Ngay khi em rời đi, mọi thứ sẽ quay lại từ đầu",
            "Nếu em muốn lưu lá thư trước khi đi, quay lại bằng nút trên cùng bên trái và nhấn lưu",
        ];
        
        for (const msg of messages) {
            await delay(1200);
            const messageDiv = document.createElement('div');
            messageDiv.className = 'ig-message received';
            messageDiv.innerHTML = `<div class="ig-message-bubble">${msg}</div>`;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        const specialMessageDiv = document.createElement('div');
        specialMessageDiv.className = 'ig-message received special-message';
        specialMessageDiv.innerHTML = `
            <div class="ig-message-bubble">
                <p>Phần cuối của món quà này, em có thể mở ra ở đây</p>
                <button id="unlockGiftBtn" class="unlock-gift-btn">Mở</button>
            </div>
        `;
        chatContainer.appendChild(specialMessageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        document.getElementById('unlockGiftBtn').addEventListener('click', showUnlockModal);

        document.getElementById('notesBackBtn').style.visibility = 'visible';
        setupInstagramInput();
    };

    const setupInstagramInput = () => {
    const messageInput = document.getElementById('igMessageInput');
    const sendButton = document.getElementById('igSendButton');
    const chatContainer = document.getElementById('igChatContainer');
    const inputWrapper = document.querySelector('.ig-input-wrapper');
    
    let typingTimeout;

    const updateSendButton = () => {
        const hasText = messageInput.value.trim() !== '';
        sendButton.classList.toggle('disabled', !hasText);
        
        if (hasText && sendButton.classList.contains('disabled')) {
            sendButton.style.transform = 'scale(1.1)';
            setTimeout(() => {
                sendButton.style.transform = '';
            }, 200);
        }
    };

    const sendMessage = () => {
        const text = messageInput.value.trim();
        logEvent('ig_message', { length: text.length });
        if (!text) return;

        sendButton.style.transform = 'scale(0.8) rotate(15deg)';
        setTimeout(() => {
            sendButton.style.transform = '';
        }, 150);

        const messageDiv = document.createElement('div');
        messageDiv.className = 'ig-message sent';
        
        messageDiv.innerHTML = `<div class="ig-message-bubble">${text}</div>`;
        chatContainer.appendChild(messageDiv);
        
        setTimeout(() => {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);

        messageInput.value = '';
        updateSendButton();
        
        inputWrapper.classList.remove('typing');
        clearTimeout(typingTimeout);
        
        messageDiv.style.transform = 'scale(1.05)';
        setTimeout(() => {
            messageDiv.style.transform = '';
        }, 200);
    };

    messageInput.addEventListener('input', () => {
        updateSendButton();
        
        if (messageInput.value.trim()) {
            inputWrapper.classList.add('typing');
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                inputWrapper.classList.remove('typing');
            }, 1000);
        } else {
            inputWrapper.classList.remove('typing');
            clearTimeout(typingTimeout);
        }
    });

    messageInput.addEventListener('focus', () => {
        inputWrapper.style.transform = 'translateY(-2px)';
    });

    messageInput.addEventListener('blur', () => {
        if (!messageInput.value.trim()) {
            inputWrapper.style.transform = '';
            inputWrapper.classList.remove('typing');
            clearTimeout(typingTimeout);
        }
    });

    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    
    updateSendButton();
    messageInput.focus();

    setTimeout(() => {
        inputWrapper.style.opacity = '0';
        inputWrapper.style.transform = 'translateY(20px)';
        inputWrapper.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        setTimeout(() => {
            inputWrapper.style.opacity = '1';
            inputWrapper.style.transform = 'translateY(0)';
        }, 100);
    }, 500);
};

    const goBackToLetter = () => {
        if(isAutomating) return;
        showScene('notes');
        logEvent('sequence_progress', { stage: 'notes_screen' });
    };

    const goBackToInstagram = () => {
        if(isAutomating) return;
        showScene('instagram');
        logEvent('sequence_progress', { stage: 'instagram_screen' });
        document.getElementById('igMessageInput').focus();
    };
    const showUnlockModal = () => {
        const modal = document.getElementById('unlockModal');
        modal.style.display = 'flex';
        document.getElementById('closeModal').onclick = () => {
            modal.style.display = 'none';
        };
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        document.getElementById('submitCode').onclick = () => {
            const code = document.getElementById('modalCodeInput').value.trim();
            const errorMessage = document.getElementById('modalErrorMessage');
            if (code === 'hit' || code === 'Hit') {
                unlockSound.play().catch(() => {});
                modal.style.display = 'none';
                document.getElementById('modalCodeInput').value = '';
                errorMessage.style.display = 'none';
                showFinalMessageSequence();
                logEvent('gift_unlocked', { codeUsed: code });
            } else {
                errorSound.play().catch(() => {});
                logEvent('gift_failed', { codeUsed: code });
                errorMessage.style.display = 'block';
                document.getElementById('modalCodeInput').value = '';
            }
        };
        document.getElementById('modalCodeInput').onkeypress = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('submitCode').click();
            }
        };
    };


    const showFinalMessageSequence = async () => {
        lockInteractions();
        scenes.instagram.classList.remove('active');
        await delay(100);
        showScene('typing');
        const typedElement = document.getElementById('typingText');
        typedElement.textContent = '';
        typedElement.parentElement.classList.add('typing');
        const finalMessages = [
            "Em biết không, trải nghiệm này Không chỉ là về bức thư Mà là để cho em thấy em đã có ý nghĩa với anh thế nào trong khoảng thời gian ngắn ngủi ấy Không phải vì tình yêu Mà là để chứng minh em đã sai",
            "Hồi đó em từng nói với anh rằng ý kiến của em có lẽ sẽ không bao giờ thay đổi Không biết em còn nhớ không Nhưng từng câu chữ, từng khoảng lặng, từng khoảnh khắc… đều được anh viết ra với em trong tâm trí",
            "Em có thể không có trí nhớ như anh, nhưng ít nhất em nên nhớ điều này…",
            "Vì thời gian em dành đọc tất cả những gì anh muốn nói Anh sẽ tặng em một điều cuối cùng Nhưng phải nói trước… món quà này hơi ích kỷ một chút Bởi vì em không thể dùng nó một mình, hay với bất kỳ người bạn nào khác",
            "Đó là một tấm vé, đến bất kỳ nhà hàng nào em chọn Nhưng em chỉ có thể dùng nó với anh thôi",
            "Để biết đâu một ngày em muốn, chúng ta có thể gặp lại, ngồi cùng nhau nói chuyện, lại bàn tán đủ thứ chuyện vô tư hàng giờ, như hồi mới quen và những lần sau đó nữa",
            "Anh biết có thể chẳng bao giờ thành sự thật Nhưng nếu em từng muốn quay ngược thời gian với anh… thì tấm vé này sẽ là chìa khóa Để quên hết mọi thứ và bắt đầu lại",
            "Anh biết đây không phải vé đi xem Matt Rife – và anh biết em chắc sẽ thích cái đó. Nhưng biết đâu một ngày nào đó, nó cũng có thể là một lựa chọn",
            "À này, mong em đừng ngại khi anh dịch hết mấy cái này. Em không tưởng tượng nổi cái cực khổ của việc phải chỉnh sửa đi chỉnh sửa lại hàng giờ qua mấy ngày trời, mà vẫn không chắc đã truyền tải đúng ý mình muốn. Nhưng thà vậy còn hơn để nguyên tiếng Anh. Anh hiểu cái khó chịu khi bị hiểu lầm và không hiểu ngôn ngữ của đối phương, nên anh nghĩ đây vẫn là lựa chọn tốt hơn. Dù vậy anh cũng đang học được nhiều lắm và vẫn đang tiếp tục mỗi ngày",
            "Lần cuối cùng… Chúc sinh nhật vui vẻ, Phương. Nếu em cần bất cứ điều gì, đừng ngần ngại nói với anh. Những khó khăn của em sẽ không bao giờ là gánh nặng"
        ];
        for (let i = 0; i < finalMessages.length; i++) {
            const message = finalMessages[i];
            await typeText(typedElement, message, 60);
            await delay(2000);
            if (i < finalMessages.length - 1) {
                await eraseText(typedElement, 15);
                await delay(500);
            }
        }
        
        typedElement.parentElement.classList.remove('typing');
        await delay(1000);
        const finalMessage = "\nCảm ơn em đã trải nghiệm điều này cùng anh. Anh hy vọng nó đã giúp chúng ta gần nhau hơn, dù chỉ trong chốc lát";
        await typeText(typedElement, finalMessage, 60);
        await delay(3000);
        showScene('instagram');
        await logEvent('sequence_progress', { stage: 'instagram_screen' });
        await delay(1000);
        await addImageMessageToChat();
        
        unlockInteractions();
    };

    const addImageMessageToChat = async () => {
        const chatContainer = document.getElementById('igChatContainer');
        const imageMessageDiv = document.createElement('div');
        imageMessageDiv.className = 'ig-message received';
        imageMessageDiv.innerHTML = `
            <div class="ig-message-bubble">
                <img src="./ticket.png" alt="Restaurant Ticket" style="max-width: 200px; border-radius: 10px; cursor: pointer;" onclick="downloadImage()" />
                <p>Chỉ cần chạm vào vé để lưu lại</p>
            </div>
        `;
        chatContainer.appendChild(imageMessageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        window.downloadImage = function() {
            const link = document.createElement('a');
            link.href = './sam.jpg';
            link.download = 'restaurant_ticket_sam.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        const unlockGiftBtn = document.getElementById('unlockGiftBtn');
        if (unlockGiftBtn) {
            unlockGiftBtn.disabled = true;
            unlockGiftBtn.style.opacity = '0.5';
            unlockGiftBtn.style.cursor = 'not-allowed';
            unlockGiftBtn.textContent = 'Gift Unlocked';
        }
    };

    const downloadPDF = () => {
        const link = document.createElement('a');
        link.href = './Phuong_Letter.pdf';
        link.download = 'Phuong_Letter.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const init = () => {
        window.checkCode = checkCode;
        window.goBackToLetter = goBackToLetter;
        window.goBackToInstagram = goBackToInstagram;
        window.downloadPDF = downloadPDF;
        
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${100 + Math.random() * 10}vh`;
            p.style.animationDelay = `${Math.random() * 25}s`;
            p.style.animationDuration = `${Math.random() * 15 + 15}s`;
            particlesContainer.appendChild(p);
        }

        codeInput.addEventListener('keypress', (e) => e.key === 'Enter' && checkCode());
        const saveNoteBtn = document.getElementById('saveNoteBtn');
        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', downloadPDF);
        }

        initMusicPlayer();
        showScene('lockbox');
        codeInput.focus();
    };

    init();
});
