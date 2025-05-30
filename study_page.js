// ====== Global Variables & DOM Elements ======
let words = []; // 단어 데이터를 담을 배열
let currentIndex = 0; // 현재 표시되는 단어의 인덱스
let isGeneralMode = true; // 현재 일반 모드인지 즐겨찾기 모드인지

// 스케줄 학습 관련 변수
let currentStudyDay = null; // 현재 학습 중인 일차 (null이면 전체 학습, Day X이면 해당 일차 학습)

// 폰트 크기 관련 전역 변수
const DEFAULT_FOREIGN_FONT_SIZE = 28; // px
const DEFAULT_MEANING_FONT_SIZE = 18; // px
const FONT_SIZE_STEP = 2; // px
const MIN_FOREIGN_FONT_SIZE = 20; // px
const MAX_FOREIGN_FONT_SIZE = 40; // px
const MIN_MEANING_FONT_SIZE = 14; // px
const MAX_MEANING_FONT_SIZE = 28; // px

let currentForeignFontSize = DEFAULT_FOREIGN_FONT_SIZE;
let currentMeaningFontSize = DEFAULT_MEANING_FONT_SIZE;

// TTS 관련 전역 변수
let availableVoices = []; // 사용 가능한 음성 목록
const TTS_LANG_MAP = { // 요청된 언어별 언어 코드 매핑 (fallback 포함)
    'ko': ['ko-KR'],
    'en': ['en-US', 'en-GB'], // 미국 영어 우선, 영국 영어 등 fallback
    'vi': ['vi-VN'],
    'km': ['km-KH'], // 캄보디아어(크메르어)
    'fa': ['fa-IR']  // 페르시아어(이란)
};

const foreignWordElem = document.getElementById('foreignWord');
const meaningElem = document.getElementById('meaning');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const statusMessageElem = document.getElementById('statusMessage');
const currentWordIndexElem = document.getElementById('currentWordIndex');
const totalWordsElem = document.getElementById('totalWords');
const favoriteIcon = document.getElementById('favoriteIcon'); // 즐겨찾기 아이콘
const favoriteBtn = document.getElementById('favoriteBtn'); // 즐겨찾기 버튼
const generalModeBtn = document.getElementById('generalModeBtn');
const favoriteModeBtn = document.getElementById('favoriteModeBtn');
const speakBtn = document.getElementById('speakBtn'); // 발음 듣기 버튼

// 새로운 DOM 요소들
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');

const sectionEditWord = document.querySelector('.section-edit-word');
const editForeignWordInput = document.getElementById('editForeignWord');
const editMeaningInput = document.getElementById('editMeaning');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editHr = document.querySelector('hr.edit-hr'); // 수정 모드 전용 hr

// 단어 박스 DOM 요소 추가 (클릭 이벤트 처리를 위해)
const foreignWordBox = document.querySelector('.foreign-word-box');
const meaningBox = document.querySelector('.meaning-box');
const foreignOverlay = document.getElementById('foreignOverlay'); // 단어 박스 안에 오버레이를 둠
const meaningOverlay = document.getElementById('meaningOverlay'); // 단어 박스 안에 오버레이를 둠

// 폰트 크기 조절 버튼 DOM 요소는 이제 통합 컨트롤 바에 포함됨
const increaseFontSizeBtn = document.getElementById('increaseFontSizeBtn');
const decreaseFontSizeBtn = document.getElementById('decreaseFontSizeBtn');

// 스와이프 관련 전역 변수
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 50; // 스와이프로 인정할 최소 수평 이동 거리 (픽셀)
const verticalScrollThreshold = 1.5; // 수평 이동이 수직 이동의 몇 배 이상이어야 스와이프로 인정할지 (스와이프 vs 스크롤 구분)
const initialMoveThreshold = 10; // 스와이프/스크롤 의도를 판단하기 위한 최소 움직임 (픽셀)
let isSwiping = false; // 스와이프 중인지 여부를 나타내는 플래그
let isScrollIntent = false; // 수직 스크롤 의도가 있는지 여부를 나타내는 플래그
const swipeInteractionArea = document.getElementById('swipeInteractionArea'); // 스와이프 감지 영역을 #swipeInteractionArea로 설정

// 추가된 DOM 요소: 즐겨찾기 일괄 삭제 버튼
const clearFavoritesDayBtn = document.getElementById('clearFavoritesDayBtn'); // Day or All Favorites Clear

// 홈 버튼 (새로 추가)
const homeBtn = document.getElementById('homeBtn');

// 현재 Day 학습이 완료되었는지 추적하는 플래그 (학습 중단점 저장 방지용)
let isCurrentDayCompleted = false;
// 전체 학습 모드에서 한 바퀴 완료되었는지 추적하는 플래그 (local storage와 연동)
let isFullStudyCompletedOnce = false; // "전체 학습하기"를 통해 진입한 후 모든 단어를 한 바퀴 완주했음을 기록

// 표시 모드 토글 아이콘 버튼 및 관련 DOM 요소
const toggleDisplayModeBtn = document.getElementById('toggleDisplayModeBtn');
const displayModeIcon = document.getElementById('displayModeIcon');
const unifiedControlsBar = document.querySelector('.unified-controls-bar'); // 통합 컨트롤 바


// ====== Functions ======

/**
 * localStorage에서 단어 데이터를 로드합니다.
 * @returns {Array} 로드된 단어 배열 또는 샘플 데이터
 */
function loadWords() {
    const storedWords = localStorage.getItem('foreignWords');
    if (storedWords) {
        try {
            const parsedWords = JSON.parse(storedWords);
            console.log('Words loaded from localStorage (study_page.js). Total:', parsedWords.length);
            return parsedWords;
        } catch (e) {
            console.error('Error parsing words from localStorage (study_page.js):', e);
            // 파싱 오류 발생 시 기본 샘플 데이터 반환
            return getDefaultSampleWords();
        }
    } else {
        console.log('No words found in localStorage. Using sample data (study_page.js).');
        return getDefaultSampleWords();
    }
}

/**
 * 기본 샘플 단어 데이터를 반환합니다.
 */
function getDefaultSampleWords() {
    return [
        { foreign: 'Apple', meaning: '사과', isFavorite: false, foreignLang: 'en-US', day: 1 },
        { foreign: '안녕하세요', meaning: 'Hello', isFavorite: false, foreignLang: 'ko-KR', day: 1 },
        { foreign: 'Book', meaning: '책', isFavorite: false, foreignLang: 'en-US', day: 1 },
        { foreign: '고맙습니다', meaning: 'Thank you', isFavorite: false, foreignLang: 'ko-KR', day: 2 },
        { foreign: 'Computer', meaning: '컴퓨터', isFavorite: false, foreignLang: 'en-US', day: 2 },
        { foreign: '죄송합니다', meaning: 'Sorry', isFavorite: false, foreignLang: 'ko-KR', day: 2 },
        { foreign: 'Water', meaning: '물', isFavorite: false, foreignLang: 'en-US', day: 3 },
        { foreign: '사랑합니다', meaning: 'I love you', isFavorite: false, foreignLang: 'ko-KR', day: 3 },
        { foreign: 'Friend', meaning: '친구', isFavorite: false, foreignLang: 'en-US', day: 3 },
        { foreign: '화장실이 어디예요?', meaning: 'Where is the restroom?', isFavorite: false, foreignLang: 'ko-KR', day: 4 },
        { foreign: 'Xin chào', meaning: '안녕하세요', isFavorite: false, foreignLang: 'vi-VN', day: 4 }, // 베트남어
        { foreign: 'សួស្តី', meaning: '안녕하세요', isFavorite: false, foreignLang: 'km-KH', day: 5 }, // 캄보디아어 (크메르어)
        { foreign: 'سلام', meaning: '안녕하세요', isFavorite: false, foreignLang: 'fa-IR', day: 5 } // 이란어 (페르시아어)
    ];
}

/**
 * localStorage에 단어 데이터를 저장합니다.
 */
function saveWords() {
    localStorage.setItem('foreignWords', JSON.stringify(words));
    console.log('Words saved to localStorage (study_page.js). Total:', words.length);
}

/**
 * 현재 모드(일반/즐겨찾기)에 따라 표시할 단어 리스트를 가져옵니다.
 * 스케줄 학습 모드일 경우, 현재 일차의 단어만 필터링합니다.
 * @returns {Array} 현재 모드에 해당하는 단어 배열
 */
function getWordsForCurrentMode() {
    let relevantWords = words; // Start with all words

    // 1. Day 학습 중이라면 해당 Day의 단어만 필터링
    if (currentStudyDay !== null) {
        console.log(`[getWordsForCurrentMode] Filtering by Day ${currentStudyDay}`);
        relevantWords = relevantWords.filter(word => word.day === currentStudyDay);
    }

    // 2. 즐겨찾기 모드라면 즐겨찾기된 단어만 필터링 (Day 필터가 먼저 적용된 후)
    if (!isGeneralMode) { // If it's Favorite Mode
        console.log(`[getWordsForCurrentMode] Further filtering by Favorite in current context`);
        relevantWords = relevantWords.filter(word => word.isFavorite);
    }
    return relevantWords;
}

/**
 * 현재 인덱스의 단어를 화면에 표시하고 상태 메시지를 업데이트합니다.
 */
function displayWord() {
    const currentWords = getWordsForCurrentMode();
    console.log('displayWord called. Mode:', isGeneralMode ? 'General' : 'Favorite', 'Current index (before adjustment):', currentIndex, 'Total words in mode:', currentWords.length, 'Current Study Day:', currentStudyDay);

    const totalWordsForDisplay = currentWords.length; 
    
    if (totalWordsForDisplay === 0) { // 현재 모드/Day에 해당하는 단어가 없는 경우
        foreignWordElem.textContent = '단어가 없습니다.';
        meaningElem.textContent = (currentStudyDay !== null) ? `Day ${currentStudyDay}에 할당된 단어가 없습니다.` : (isGeneralMode ? '첫 페이지에서 새로운 단어를 추가하거나 단어를 가져오세요.' : '즐겨찾기된 단어가 없습니다.');
        statusMessageElem.textContent = '';
        currentWordIndexElem.textContent = '0';
        totalWordsElem.textContent = '0'; 
        favoriteIcon.src = 'https://img.icons8.com/ios-glyphs/24/000000/star--v1.png'; // 기본 별
        editBtn.disabled = true;
        deleteBtn.disabled = true;
        speakBtn.disabled = true;
        favoriteBtn.disabled = true;
        clearFavoritesDayBtn.disabled = true; // 단어가 없으면 즐겨찾기 해제도 비활성화

        foreignOverlay.classList.add('hidden'); // 텍스트를 바로 보여줌
        meaningOverlay.classList.add('hidden'); // 텍스트를 바로 보여줌
        console.log('No words in current mode. Overlays hidden (text visible).');
        return;
    }

    // 단어가 있을 경우 버튼 활성화
    editBtn.disabled = false;
    deleteBtn.disabled = false;
    speakBtn.disabled = false;
    favoriteBtn.disabled = false;
    clearFavoritesDayBtn.disabled = false; 
    
    // 인덱스 범위 보정 (순환 로직이 아닌 일반적인 범위 내 보정)
    if (currentIndex < 0) {
        currentIndex = 0;
    }
    if (currentIndex >= currentWords.length) {
        currentIndex = currentWords.length - 1;
    }
    console.log('Current index (after adjustment):', currentIndex);

    const currentWord = currentWords[currentIndex];
    foreignWordElem.textContent = currentWord.foreign;
    meaningElem.textContent = currentWord.meaning;

    updateFavoriteIcon(currentWord.isFavorite);

    statusMessageElem.textContent = ''; 
    isCurrentDayCompleted = false; // Day 학습 완료 플래그 초기화 (Day 학습 중일 때만 사용)

    // Day 학습 모드일 때만 버튼 비활성화 로직 적용 (Day 경계)
    if (currentStudyDay !== null) {
        // Prev 버튼 활성화/비활성화
        if (currentIndex === 0) {
            prevBtn.disabled = true;
            statusMessageElem.textContent = '자료의 처음입니다.';
        } else {
            prevBtn.disabled = false;
        }
        // Next 버튼 활성화/비활성화
        if (currentIndex === currentWords.length - 1) {
            nextBtn.disabled = true;
            statusMessageElem.textContent = '자료의 마지막입니다.';
        } else {
            nextBtn.disabled = false;
        }

        // Day 학습 완료 로직
        if (currentIndex === currentWords.length - 1 && currentWords.length > 0) {
            const completedDays = JSON.parse(localStorage.getItem('completedDays') || '{}');
            if (!completedDays[`day${currentStudyDay}`]) { 
                completedDays[`day${currentStudyDay}`] = true;
                localStorage.setItem('completedDays', JSON.stringify(completedDays));
                alert(`Day ${currentStudyDay}의 학습을 완료했습니다!`);
                isCurrentDayCompleted = true; // 현재 Day 학습 완료 플래그 설정
            }
        }
    } else { // 일반 모드 또는 즐겨찾기 모드 (전체 학습)일 때는 버튼 항상 활성화 (순환)
        prevBtn.disabled = false;
        nextBtn.disabled = false;
        if (currentIndex === 0 && currentWords.length > 0) {
            statusMessageElem.textContent = '자료의 처음입니다.';
        }
        if (currentIndex === currentWords.length - 1 && currentWords.length > 0) {
            statusMessageElem.textContent = '자료의 마지막입니다.';
        }
    }


    currentWordIndexElem.textContent = currentIndex + 1;
    totalWordsElem.textContent = totalWordsForDisplay.toString(); 

    saveCurrentIndex();

    applyOverlayState();
    console.log('After displayWord, current foreign:', foreignWordElem.textContent, 'meaning:', meaningElem.textContent);
}

/**
 * 현재 모드의 마지막 인덱스를 localStorage에 저장합니다.
 */
function saveCurrentIndex() {
    // currentStudyDay가 null일 때만 (전체 학습 또는 즐겨찾기 모드) 인덱스 저장
    if (currentStudyDay === null) { 
        if (isGeneralMode) { // 전체 학습 (isGeneralMode가 true일 때만 full study로 간주)
            localStorage.setItem('generalModeIndex', currentIndex);
            // favoriteModeIndex는 여기서 저장하지 않음.
        } else { // 즐겨찾기 모드
            localStorage.setItem('favoriteModeIndex', currentIndex);
            // generalModeIndex는 여기서 저장하지 않음.
        }
        console.log(`Current index (${isGeneralMode ? 'general' : 'favorite'}) saved: ${currentIndex}`);
    }
    // Day 학습 모드일 경우, currentStudyDay와 currentIndex는 페이지 로드 시 navigateToDay/Index로 처리되므로 여기서 별도 저장 안함
}

/**
 * localStorage에서 현재 모드의 마지막 인덱스를 로드합니다.
 * @returns {number} 로드된 인덱스 또는 0
 */
function loadCurrentIndex() {
    const storedIndex = isGeneralMode ?
        localStorage.getItem('generalModeIndex') :
        localStorage.getItem('favoriteModeIndex');
    return storedIndex ? parseInt(storedIndex, 10) : 0;
}


/**
 * 즐겨찾기 아이콘 상태를 업데이트합니다.
 * @param {boolean} isFavorite - 현재 단어가 즐겨찾기인지 여부
 */
function updateFavoriteIcon(isFavorite) {
    if (isFavorite) {
        favoriteIcon.src = 'https://img.icons8.com/ios-filled/24/FAB005/star--v1.png'; // 채워진 노란색 별
        favoriteIcon.alt = '즐겨찾기 해제';
    } else {
        favoriteIcon.src = 'https://img.icons8.com/ios-glyphs/24/000000/star--v1.png'; // 비워진 검은색 별
        favoriteIcon.alt = '즐겨찾기 추가';
    }
}

/**
 * 즐겨찾기 상태를 토글합니다.
 */
function toggleFavorite() {
    const currentWordsInView = getWordsForCurrentMode();
    if (currentWordsInView.length === 0) return;

    const currentWord = currentWordsInView[currentIndex];
    // 실제 words 배열에서 해당 단어를 찾아 즐겨찾기 상태 변경
    const originalWordIndex = words.findIndex(word =>
        word.foreign === currentWord.foreign && word.meaning === currentWord.meaning &&
        word.foreignLang === currentWord.foreignLang && word.day === currentWord.day 
    );

    if (originalWordIndex !== -1) {
        words[originalWordIndex].isFavorite = !words[originalWordIndex].isFavorite;
        saveWords();

        updateFavoriteIcon(words[originalWordIndex].isFavorite);

        if (!isGeneralMode) { // 즐겨찾기 모드에서 즐겨찾기 해제 시
            // 해제된 단어는 현재 뷰에서 사라지므로, 인덱스 조정 후 다시 표시
            if (!words[originalWordIndex].isFavorite) { 
                const updatedCurrentWordsInView = getWordsForCurrentMode(); // 업데이트된 즐겨찾기 목록
                if (currentIndex >= updatedCurrentWordsInView.length && updatedCurrentWordsInView.length > 0) {
                    currentIndex--; // 현재 인덱스가 목록 범위를 초과하면 감소
                }
                if (updatedCurrentWordsInView.length === 0) {
                    currentIndex = 0; // 목록이 비면 인덱스 0으로
                }
                displayWord(); // 변경된 목록과 인덱스로 다시 표시
            }
        }
    }
}


/**
 * 모드를 변경하고 데이터를 다시 로드하여 표시합니다.
 * @param {boolean} generalMode - 일반 모드 여부 (true: 일반, false: 즐겨찾기)
 */
function changeMode(generalMode) {
    isGeneralMode = generalMode;
    localStorage.setItem('lastAppMode', isGeneralMode ? 'general' : 'favorite');
    console.log(`Mode changed to: ${isGeneralMode ? 'General' : 'Favorite'}`);

    // Day 학습 중이라면, currentStudyDay는 유지하고 해당 Day 내에서 모드 변경
    // Day 학습 중이 아니라면, 전체 단어 대상으로 모드 변경 (currentStudyDay는 null 유지)

    // 모드 변경 시 항상 해당 뷰의 첫 단어부터 시작하도록 인덱스 초기화
    // (이전 모드에서 다른 인덱스에 있었더라도 새 모드의 처음부터 다시 탐색하는 것이 자연스러움)
    currentIndex = 0; 
    
    generalModeBtn.classList.toggle('active', isGeneralMode);
    favoriteModeBtn.classList.toggle('active', !isGeneralMode);

    displayWord();
    applyOverlayState(); 
}

/**
 * TTS: 사용 가능한 음성 목록을 채웁니다.
 */
function populateVoiceList() {
    availableVoices = window.speechSynthesis.getVoices();
    console.log('Available voices loaded:', availableVoices);
    if (availableVoices.length === 0) {
        console.warn('No speech synthesis voices found.');
    }
}

if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = populateVoiceList;
    populateVoiceList();
}


/**
 * TTS: 현재 단어를 발음합니다.
 */
function speakCurrentWord() {
    if (!('speechSynthesis' in window)) {
        alert('이 브라우저에서는 음성 합성(TTS)을 지원하지 않습니다.');
        console.error('Speech synthesis not supported in this browser.');
        return;
    }

    const currentWords = getWordsForCurrentMode();
    if (currentWords.length === 0) {
        alert('발음할 단어가 없습니다.');
        return;
    }

    const currentWord = currentWords[currentIndex];
    const textToSpeak = currentWord.foreign;
    const langToSpeak = currentWord.foreignLang || 'en-US'; 
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    utterance.lang = langToSpeak;

    const langPrefix = langToSpeak.substring(0, 2); 
    const desiredLangs = TTS_LANG_MAP[langPrefix]; 

    let selectedVoice = null;
    if (desiredLangs) {
        for (const langCode of desiredLangs) {
            selectedVoice = availableVoices.find(v => v.lang === langCode);
            if (selectedVoice) {
                break;
            }
        }
    }
    if (!selectedVoice) {
        selectedVoice = availableVoices.find(v => v.lang.startsWith(langPrefix));
    }
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Using specific voice: ${selectedVoice.name} (${selectedVoice.lang}) for ${langToSpeak}`);
    } else {
        console.warn(`No specific voice found for ${langToSpeak} or ${langPrefix}, using default browser voice.`);
    }

    utterance.pitch = 1;
    utterance.rate = 1;

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error, 'for text:', textToSpeak, 'lang:', langToSpeak);
        alert('발음 재생 중 오류가 발생했습니다. 브라우저 음성 설정 또는 인터넷 연결을 확인해주세요. 오류: ' + event.error);
    };

    try {
        window.speechSynthesis.cancel(); 
        window.speechSynthesis.speak(utterance);
        console.log('Attempting to speak:', textToSpeak, 'in language:', langToSpeak);
    } catch (e) {
        console.error('Speech synthesis API call failed:', e);
        alert('음성 서비스에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.');
    }
}

/**
 * 현재 단어를 삭제합니다.
 */
function deleteWord() {
    const currentWordsInView = getWordsForCurrentMode();
    if (currentWordsInView.length === 0) {
        alert('삭제할 단어가 없습니다.');
        return;
    }

    if (!confirm('정말로 이 단어를 삭제하시겠습니까?\n\n' +
        currentWordsInView[currentIndex].foreign + ' - ' + currentWordsInView[currentIndex].meaning)) {
        return;
    }

    const currentWordToDelete = currentWordsInView[currentIndex];
    // 실제 words 배열에서 해당 단어를 찾아 삭제
    const originalWordIndex = words.findIndex(word =>
        word.foreign === currentWordToDelete.foreign && word.meaning === currentWordToDelete.meaning &&
        word.foreignLang === currentWordToDelete.foreignLang && word.day === currentWordToDelete.day
    );

    if (originalWordIndex !== -1) {
        words.splice(originalWordIndex, 1);
        saveWords();

        // 삭제 후 인덱스 조정: 현재 인덱스가 총 단어 수를 넘어가면 마지막 인덱스로 조정
        // 또는 단어가 하나도 없게 되면 0으로
        if (currentIndex >= getWordsForCurrentMode().length && currentIndex > 0) {
            currentIndex--;
        }
        if (getWordsForCurrentMode().length === 0) {
            currentIndex = 0;
        }
        displayWord();
        applyOverlayState(); 
        alert('단어가 삭제되었습니다.');
    }
}

/**
 * 단어 수정 모드로 진입합니다.
 */
function startEdit() {
    const currentWordsInView = getWordsForCurrentMode();
    if (currentWordsInView.length === 0) {
        alert('수정할 단어가 없습니다.');
        return;
    }

    const currentWord = currentWordsInView[currentIndex];
    editForeignWordInput.value = currentWord.foreign;
    editMeaningInput.value = currentWord.meaning;

    sectionEditWord.style.display = 'block';
    editHr.style.display = 'block';
    // 통합 컨트롤 바 숨김
    if (unifiedControlsBar) unifiedControlsBar.style.display = 'none';
}

/**
 * 수정된 단어를 저장합니다.
 */
function saveEdit() {
    const currentWordsInView = getWordsForCurrentMode();
    if (currentWordsInView.length === 0) return;

    const editedForeign = editForeignWordInput.value.trim();
    const editedMeaning = editMeaningInput.value.trim();

    if (editedForeign && editedMeaning) {
        const currentWord = currentWordsInView[currentIndex];
        // 실제 words 배열에서 해당 단어를 찾아 수정
        const originalWordIndex = words.findIndex(word =>
            word.foreign === currentWord.foreign && word.meaning === currentWord.meaning &&
            word.foreignLang === currentWord.foreignLang && word.day === currentWord.day
        );

        if (originalWordIndex !== -1) {
            words[originalWordIndex].foreign = editedForeign;
            words[originalWordIndex].meaning = editedMeaning;
            saveWords();

            cancelEdit(); 
            displayWord();
            applyOverlayState(); 
            alert('단어가 수정되었습니다!');
        }
    } else {
        alert('외국어 단어와 의미를 모두 입력해주세요.');
    }
}

/**
 * 단어 수정 모드를 취소합니다.
 */
function cancelEdit() {
    sectionEditWord.style.display = 'none';
    editHr.style.display = 'none';
    // 통합 컨트롤 바 다시 표시
    if (unifiedControlsBar) unifiedControlsBar.style.display = 'flex';
}

/**
 * 현재 표시 모드에 따라 오버레이를 적용/제거하고 아이콘을 업데이트합니다.
 */
function applyOverlayState() {
    const selectedMode = localStorage.getItem('displayMode') || 'AB'; 

    console.log('[applyOverlayState] Applying overlay for mode:', selectedMode);

    if (getWordsForCurrentMode().length === 0) {
        foreignOverlay.classList.add('hidden');
        meaningOverlay.classList.add('hidden');
        return;
    }

    foreignOverlay.classList.add('hidden'); 
    meaningOverlay.classList.add('hidden'); 

    if (selectedMode === 'AB') { 
        meaningOverlay.classList.remove('hidden'); 
        if (displayModeIcon) displayModeIcon.src = 'https://img.icons8.com/ios-glyphs/24/000000/forward--v1.png'; // A->B 화살표
        displayModeIcon.alt = '외국어 ➡️ 모국어 (B)';
    } else if (selectedMode === 'BA') { 
        foreignOverlay.classList.remove('hidden'); 
        if (displayModeIcon) displayModeIcon.src = 'https://img.icons8.com/ios-glyphs/24/000000/back--v1.png'; // B->A 화살표
        displayModeIcon.alt = '모국어 ➡️ 외국어 (A)';
    }
}

/**
 * 표시 모드를 토글합니다 (A->B <-> B->A).
 */
function toggleDisplayMode() {
    const currentMode = localStorage.getItem('displayMode') || 'AB';
    const newMode = (currentMode === 'AB') ? 'BA' : 'AB';
    localStorage.setItem('displayMode', newMode);
    console.log('[toggleDisplayMode] Toggled display mode to:', newMode);
    applyOverlayState(); // UI 업데이트
}


/**
 * 특정 오버레이의 표시 여부를 토글합니다.
 */
function toggleSingleOverlay(overlayElement) {
    // 이 함수는 클릭 이벤트 자체에서 호출되므로, 스와이프 여부를 여기서 직접 확인할 필요가 없습니다.
    // 스와이프는 swipeInteractionArea의 touchmove에서 event.preventDefault()를 통해 클릭 이벤트 자체를 막습니다.
    overlayElement.classList.toggle('hidden');
    console.log(`Overlay ${overlayElement.id} toggled. New state: ${overlayElement.classList.contains('hidden') ? 'hidden' : 'visible'}`);
}


/**
 * 폰트 크기를 localStorage에서 로드하거나 기본값을 설정합니다.
 */
function loadFontSizes() {
    const storedForeignSize = localStorage.getItem('foreignFontSize');
    const storedMeaningSize = localStorage.getItem('meaningFontSize');

    currentForeignFontSize = storedForeignSize ? parseInt(storedForeignSize, 10) : DEFAULT_FOREIGN_FONT_SIZE;
    currentMeaningFontSize = storedMeaningSize ? parseInt(storedMeaningSize, 10) : DEFAULT_MEANING_FONT_SIZE;

    currentForeignFontSize = Math.max(MIN_FOREIGN_FONT_SIZE, Math.min(currentForeignFontSize, MAX_FOREIGN_FONT_SIZE));
    currentMeaningFontSize = Math.max(MIN_MEANING_FONT_SIZE, Math.min(currentMeaningFontSize, MAX_MEANING_FONT_SIZE));


    console.log(`Loaded Font Sizes: Foreign=${currentForeignFontSize}, Meaning=${currentMeaningFontSize}`);
}

/**
 * 현재 폰트 크기를 localStorage에 저장합니다.
 */
function saveFontSizes() {
    localStorage.setItem('foreignFontSize', currentForeignFontSize);
    localStorage.setItem('meaningFontSize', currentMeaningFontSize);
    console.log(`Saved Font Sizes: Foreign=${currentForeignFontSize}, Meaning=${currentMeaningFontSize}`);
}

/**
 * 현재 폰트 크기를 DOM 요소에 적용합니다.
 */
function applyFontSizes() {
    foreignWordElem.style.fontSize = `${currentForeignFontSize}px`;
    meaningElem.style.fontSize = `${currentMeaningFontSize}px`;
    console.log(`Applied Font Sizes: Foreign=${currentForeignFontSize}px, Meaning=${currentMeaningFontSize}px`);
}

/**
 * 폰트 크기를 조절하고 localStorage에 저장, DOM에 적용합니다.
 * @param {boolean} isIncrease - true면 증가, false면 감소
 */
function adjustFontSize(isIncrease) {
    if (isIncrease) {
        currentForeignFontSize = Math.min(currentForeignFontSize + FONT_SIZE_STEP, MAX_FOREIGN_FONT_SIZE);
        currentMeaningFontSize = Math.min(currentMeaningFontSize + FONT_SIZE_STEP, MAX_MEANING_FONT_SIZE);
    } else {
        currentForeignFontSize = Math.max(currentForeignFontSize - FONT_SIZE_STEP, MIN_FOREIGN_FONT_SIZE);
        currentMeaningFontSize = Math.max(currentMeaningFontSize - FONT_SIZE_STEP, MIN_MEANING_FONT_SIZE);
    }
    saveFontSizes();
    applyFontSizes();
}

/**
 * 현재 Day 또는 전체 단어의 즐겨찾기 단어를 모두 해제합니다.
 */
function clearDayFavorites() {
    let targetWordsForConfirm; // 확인 메시지를 위한 단어 목록
    let confirmMessage;
    
    // 현재 학습 중인 "범위"를 파악하여 대상 단어 목록을 결정
    if (currentStudyDay !== null) { // Day 학습 중인 경우
        targetWordsForConfirm = words.filter(word => word.day === currentStudyDay && word.isFavorite);
        if (targetWordsForConfirm.length === 0) {
            alert(`Day ${currentStudyDay}에 즐겨찾기된 단어가 없습니다.`);
            return;
        }
        confirmMessage = `정말로 Day ${currentStudyDay}의 즐겨찾기 단어 ${targetWordsForConfirm.length}개를 모두 해제하시겠습니까?`;
    } else { // Day가 null인 경우 (전체 학습 또는 즐겨찾기 모드)
        targetWordsForConfirm = words.filter(word => word.isFavorite); // 모든 즐겨찾기된 단어 대상
        if (targetWordsForConfirm.length === 0) {
            alert('즐겨찾기된 단어가 없습니다.');
            return;
        }
        confirmMessage = `정말로 모든 단어의 즐겨찾기 ${targetWordsForConfirm.length}개를 모두 해제하시겠습니까?`;
    }

    if (!confirm(confirmMessage)) {
        return;
    }

    let clearedCount = 0;
    words.forEach(word => {
        if (currentStudyDay !== null) { // Day 학습 중인 경우
            if (word.day === currentStudyDay && word.isFavorite) {
                word.isFavorite = false;
                clearedCount++;
            }
        } else { // Day가 null인 경우 (전체 단어 대상)
            if (word.isFavorite) {
                word.isFavorite = false;
                clearedCount++;
            }
        }
    });
    saveWords(); // 변경된 내용 저장
    
    alert(`${clearedCount}개의 즐겨찾기 단어가 해제되었습니다.`);

    // 즐겨찾기 모드에서 단어가 해제되면 목록이 변경되므로 인덱스 초기화 및 재표시
    // 현재 모드가 Day 학습 + 즐겨찾기 필터일 경우, Day 학습 범위를 벗어나지 않도록
    // 현재 모드가 전체 학습 + 즐겨찾기 필터일 경우, 전체 즐겨찾기 목록을 새로고침
    currentIndex = 0; 
    displayWord(); // 업데이트된 목록으로 다시 표시
}

/**
 * 홈으로 돌아가는 함수
 */
function goHome() {
    // currentStudyDay가 null이 아닌 경우 (Day 학습 중)
    if (currentStudyDay !== null) {
        // Day 학습이 완료되지 않았다면 중단점 저장
        if (!isCurrentDayCompleted) {
            localStorage.setItem('lastInterruptedStudyDay', currentStudyDay);
            localStorage.setItem('lastInterruptedStudyIndex', currentIndex);
            console.log(`[UNLOAD] Interrupted Day session saved: Day ${currentStudyDay}, Index ${currentIndex}`);
        } else {
            console.log('[UNLOAD] Day session completed. Clearing Day interruption data.');
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
        }
        // Day 학습에서 홈으로 이동 시 다른 학습 중단점 초기화
        localStorage.removeItem('lastInterruptedFullStudyIndex');
        localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        localStorage.removeItem('isFullStudyCompletedFlag'); 
    } 
    // currentStudyDay가 null인 경우 (전체 학습 또는 즐겨찾기 모드)
    else { 
        // 일반 모드 (isGeneralMode === true) - 전체 학습
        if (isGeneralMode) {
            // 전체 학습이 한 바퀴 완료되지 않았다면 중단점 저장
            if (!isFullStudyCompletedOnce) { 
                localStorage.setItem('lastInterruptedFullStudyIndex', currentIndex);
                console.log(`[UNLOAD] Interrupted Full Study session saved: Index ${currentIndex}`);
            } else {
                console.log('[UNLOAD] Full study cycle completed. Clearing Full Study interruption data.');
                localStorage.removeItem('lastInterruptedFullStudyIndex');
                // isFullStudyCompletedFlag는 `nextBtn`에서 설정되고, `first_page.js`에서 처리될 때 지워짐.
                // 여기서는 유지 (main 페이지에서 읽을 수 있도록)
            }
            // 다른 학습 중단점 초기화
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        } 
        // 즐겨찾기 모드 (isGeneralMode === false)
        else {
            // 즐겨찾기 학습은 완료 개념이 없으므로 항상 중단점 저장
            localStorage.setItem('lastInterruptedFavoriteStudyIndex', currentIndex);
            console.log(`[UNLOAD] Interrupted Favorite Study session saved: Index ${currentIndex}`);
            // 다른 학습 중단점 초기화
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFullStudyIndex');
            localStorage.removeItem('isFullStudyCompletedFlag'); 
        }
    }
    
    // 페이지 이동 시 모든 navigateTo* 플래그 초기화
    localStorage.removeItem('currentStudyDay'); 
    localStorage.removeItem('navigateToWord'); 
    localStorage.removeItem('navigateToDay');
    localStorage.removeItem('navigateToIndex'); 
    localStorage.removeItem('navigateToFullStudyIndex'); 
    localStorage.removeItem('navigateToFavoriteStudyIndex'); 

    window.location.href = 'index.html'; 
}


// ====== 스와이프 기능 ======
// 스와이프 감지 영역을 #swipeInteractionArea로 설정
swipeInteractionArea.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) { 
        touchStartX = e.touches[0].clientX; 
        touchStartY = e.touches[0].clientY; 
        isSwiping = false; 
        isScrollIntent = false; 
        console.log('Touch start:', touchStartX, touchStartY);
    }
});

swipeInteractionArea.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) { 
        const currentTouchX = e.touches[0].clientX; 
        const currentTouchY = e.touches[0].clientY; 
        const deltaX = currentTouchX - touchStartX;
        const deltaY = currentTouchY - touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (!isSwiping && !isScrollIntent) {
            if (absDeltaX > initialMoveThreshold || absDeltaY > initialMoveThreshold) {
                if (absDeltaX > absDeltaY * verticalScrollThreshold) {
                    isSwiping = true;
                    e.preventDefault(); 
                    console.log('Swipe gesture initiated. Preventing default.');
                } 
                else if (absDeltaY > absDeltaX * verticalScrollThreshold) {
                    isScrollIntent = true; 
                    console.log('Scroll gesture initiated. Not preventing default.');
                }
            }
        } 
        else if (isSwiping) {
            e.preventDefault();
        }
        
        touchEndX = currentTouchX;
        touchEndY = currentTouchY;
        console.log('Touch move: deltaX=', deltaX, 'deltaY=', deltaY, 'isSwiping=', isSwiping, 'isScrollIntent=', isScrollIntent);
    }
});

swipeInteractionArea.addEventListener('touchend', (e) => {
    const deltaX = touchEndX - touchStartX;
    console.log('Touch end. Final deltaX:', deltaX, 'was isSwiping:', isSwiping);

    if (isSwiping && Math.abs(deltaX) > swipeThreshold) { 
        // 스와이프 방향 로직: 오른쪽으로 스와이프 시 다음, 왼쪽으로 스와이프 시 이전
        if (deltaX > 0) { // 오른쪽으로 스와이프
            nextBtn.click(); // 다음 단어
            console.log('Swipe detected: Next word (swiped right)');
        } else { // 왼쪽으로 스와이프
            prevBtn.click(); // 이전 단어
            console.log('Swipe detected: Prev word (swiped left)');
        }
    } else {
        console.log('Gesture was not a significant swipe.');
    }
    
    isSwiping = false;
    isScrollIntent = false;
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
});


// ====== Event Listeners ======

prevBtn.addEventListener('click', () => {
    const currentWords = getWordsForCurrentMode();
    if (currentWords.length === 0) {
        statusMessageElem.textContent = '단어가 없습니다.';
        return;
    }

    if (currentStudyDay !== null) { // Day 학습 모드일 경우 (Day 경계 유지)
        if (currentIndex > 0) {
            currentIndex--;
            displayWord();
        } else {
            statusMessageElem.textContent = '자료의 처음입니다.';
        }
    } else { // 일반 모드 또는 즐겨찾기 모드 (전체 단어 대상, 순환)
        if (currentIndex > 0) {
            currentIndex--;
        } else { // 리스트의 처음에서 이전 누르면 끝으로 이동
            currentIndex = currentWords.length - 1;
            statusMessageElem.textContent = '자료의 마지막입니다.'; 
        }
        displayWord();
    }
});

nextBtn.addEventListener('click', () => {
    const currentWords = getWordsForCurrentMode();
    if (currentWords.length === 0) {
        statusMessageElem.textContent = '단어가 없습니다.';
        return;
    }

    if (currentStudyDay !== null) { // Day 학습 모드일 경우 (Day 경계 유지)
        if (currentIndex < currentWords.length - 1) {
            currentIndex++;
            displayWord();
        } else {
            statusMessageElem.textContent = '자료의 마지막입니다.';
        }
    } else { // 일반 모드 또는 즐겨찾기 모드 (전체 단어 대상, 순환)
        if (currentIndex < currentWords.length - 1) {
            currentIndex++;
        } else { // 리스트의 끝에서 다음 누르면 처음으로 이동
            currentIndex = 0;
            statusMessageElem.textContent = '자료의 처음입니다.'; 
            
            // --- MODIFIED COMPLETION ALERT LOGIC ---
            if (currentWords.length > 0) { // Only alert if there are words in the current list
                if (isGeneralMode) { // This is the 'Full Study' of ALL words completion
                    alert('축하합니다! 모든 단어 학습 과정을 완료했습니다!');
                    localStorage.setItem('isFullStudyCompletedFlag', 'true'); 
                    goHome(); // Redirect to home page
                    return; // Stop further execution
                } else { // This is 'Favorite Mode' completion (looping through favorites)
                    alert('축하합니다! 즐겨찾기 단어 목록을 모두 한 바퀴 돌았습니다!');
                    // **MODIFICATION HERE**: Instead of looping, go home as per "무한반복 안되게"
                    goHome(); // Redirect to home page
                    return; // Stop further execution
                }
            }
            // --- END MODIFIED COMPLETION ALERT LOGIC ---
        }
        displayWord();
    }
});

favoriteBtn.addEventListener('click', toggleFavorite);

generalModeBtn.addEventListener('click', () => changeMode(true));
favoriteModeBtn.addEventListener('click', () => changeMode(false));

speakBtn.addEventListener('click', speakCurrentWord);

editBtn.addEventListener('click', startEdit);
deleteBtn.addEventListener('click', deleteWord);
saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', cancelEdit);

if (clearFavoritesDayBtn) {
    clearFavoritesDayBtn.addEventListener('click', clearDayFavorites);
}

homeBtn.addEventListener('click', goHome);


// 오버레이 및 단어 박스 클릭 이벤트 리스너 (토글 기능)
foreignOverlay.addEventListener('click', (event) => {
    toggleSingleOverlay(foreignOverlay); 
});
meaningOverlay.addEventListener('click', (event) => {
    toggleSingleOverlay(meaningOverlay); 
});

// word-box 자체를 클릭해도 오버레이 토글
foreignWordBox.addEventListener('click', (event) => {
    if (event.target !== foreignOverlay) { 
        toggleSingleOverlay(foreignOverlay); 
    }
});

meaningBox.addEventListener('click', (event) => {
    if (event.target !== meaningOverlay) { 
        toggleSingleOverlay(meaningOverlay); 
    }
});


increaseFontSizeBtn.addEventListener('click', () => adjustFontSize(true));
decreaseFontSizeBtn.addEventListener('click', () => adjustFontSize(false));


// 표시 모드 토글 아이콘 버튼에 이벤트 리스너 연결
if (toggleDisplayModeBtn) {
    toggleDisplayModeBtn.addEventListener('click', toggleDisplayMode);
}


// ====== Initialization ======
window.addEventListener('load', () => {
    words = loadWords(); 
    
    // URL 매개변수에서 currentStudyDay 값을 가져와 설정 (Day 버튼을 통해 들어왔을 경우)
    currentStudyDay = localStorage.getItem('currentStudyDay') ? parseInt(localStorage.getItem('currentStudyDay'), 10) : null;
    console.log('[INIT] currentStudyDay on load:', currentStudyDay);

    loadFontSizes();
    applyFontSizes();
    console.log('[INIT] Font sizes initialized and applied.');

    const savedDisplayMode = localStorage.getItem('displayMode');
    console.log(`[INIT-MODE] On load, localStorage 'displayMode' READ: "${savedDisplayMode}"`);

    // 통합 컨트롤 바의 표시 모드 아이콘 초기화
    applyOverlayState(); // 이 함수가 displayModeIcon의 src와 alt를 설정


    let initialIndex = 0;
    let initialModeIsGeneral = true; // 기본 모드는 일반 모드

    // 네비게이션 우선순위:
    // 1. navigateToWord (검색 결과로 이동)
    // 2. navigateToDay / navigateToIndex (Day 학습 이어서 보기)
    // 3. navigateToFullStudyIndex (전체 학습 이어서 보기)
    // 4. navigateToFavoriteStudyIndex (즐겨찾기 학습 이어서 보기)
    // 5. 일반적인 모드 (lastAppMode)에 따른 인덱스 로드 (currentStudyDay가 null일 때만 적용)

    const navigateToWord = localStorage.getItem('navigateToWord'); 
    const navigateToDay = localStorage.getItem('navigateToDay');   
    const navigateToIndex = localStorage.getItem('navigateToIndex'); 
    const navigateToFullStudyIndex = localStorage.getItem('navigateToFullStudyIndex'); 
    const navigateToFavoriteStudyIndex = localStorage.getItem('navigateToFavoriteStudyIndex'); 


    if (navigateToWord) { // 1. 검색 결과로 이동 (가장 높은 우선순위)
        const targetWord = JSON.parse(navigateToWord);
        localStorage.removeItem('navigateToWord'); // 사용했으니 삭제

        // 검색 결과는 해당 Day의 일반 모드로 이동
        currentStudyDay = targetWord.day !== undefined ? targetWord.day : null;
        initialModeIsGeneral = true; 

        // 현재 모드(Day 범위가 적용된)에서 검색된 단어의 인덱스를 찾음
        const currentWordsInView = getWordsForCurrentMode(); 
        const foundIndex = currentWordsInView.findIndex(word =>
            word.foreign === targetWord.foreign && word.meaning === targetWord.meaning &&
            word.foreignLang === targetWord.foreignLang && word.day === targetWord.day
        );

        if (foundIndex !== -1) {
            initialIndex = foundIndex;
            console.log(`[INIT] Navigating to searched word at index: ${initialIndex}`);
        } else {
            initialIndex = 0; 
            console.warn('[INIT] Searched word not found in current mode/day context. Displaying first word.');
        }

    } 
    else if (navigateToDay && navigateToIndex) { // 2. Day 학습 이어서 보기
        currentStudyDay = parseInt(navigateToDay, 10); // 해당 Day로 설정
        initialIndex = parseInt(navigateToIndex, 10);
        initialModeIsGeneral = true; // Day 학습은 항상 일반 모드로 시작 (Day 범위는 유지)

        localStorage.removeItem('navigateToDay'); // 사용했으니 삭제
        localStorage.removeItem('navigateToIndex'); // 사용했으니 삭제
        console.log(`[INIT] Resuming Day session: Day ${currentStudyDay}, Index ${initialIndex}`);

    }
    else if (navigateToFullStudyIndex !== null) { // 3. 전체 학습 이어서 보기
        initialIndex = parseInt(navigateToFullStudyIndex, 10);
        initialModeIsGeneral = true; // 전체 학습은 항상 일반 모드
        currentStudyDay = null; // 전체 학습은 Day 학습이 아님
        localStorage.removeItem('navigateToFullStudyIndex'); // 사용했으니 삭제
        console.log(`[INIT] Navigating to interrupted Full Study at index: ${initialIndex}`);
    }
    else if (navigateToFavoriteStudyIndex !== null) { // 4. 즐겨찾기 학습 이어서 보기
        initialIndex = parseInt(navigateToFavoriteStudyIndex, 10);
        initialModeIsGeneral = false; // 즐겨찾기 모드
        currentStudyDay = null; // 즐겨찾기 모드는 Day에 국한되지 않음
        localStorage.removeItem('navigateToFavoriteStudyIndex'); // 사용했으니 삭제
        console.log(`[INIT] Navigating to interrupted Favorite Study at index: ${initialIndex}`);
    }
    else { // 5. 위 조건에 해당하지 않으면, 기존 모드 (Day 학습 중이거나 일반/즐겨찾기)의 마지막 인덱스
        const lastAppMode = localStorage.getItem('lastAppMode');
        
        // currentStudyDay가 null이 아닌 경우 (Day 버튼을 통해 페이지에 진입한 상태)
        // lastAppMode와 상관없이 강제로 일반 모드를 적용하여 해당 Day의 전체 단어를 보여줍니다.
        if (currentStudyDay !== null) { 
            initialModeIsGeneral = true; // Day 학습 진입시 항상 일반 모드 (해당 Day의 모든 단어)
            initialIndex = 0; // Day 학습으로 진입 시, 해당 Day의 처음부터 시작
            console.log('[INIT] Day Study Mode: Forcing General Mode and starting from index 0.');
        } else { // Day 학습 중이 아닐 때 (즉, 일반/즐겨찾기 모드)
            initialModeIsGeneral = (lastAppMode === 'favorite') ? false : true; // 마지막으로 사용했던 모드
            initialIndex = loadCurrentIndex(); // 해당 모드의 마지막 인덱스 로드
            console.log(`[INIT] General/Favorite Mode: Starting from saved index ${initialIndex}.`);
        }
    }

    isGeneralMode = initialModeIsGeneral;
    currentIndex = initialIndex;
    // 전체 학습 완료 플래그 로드 (home 버튼으로 이동 시 이 플래그가 true면 main 페이지에서 특정 메시지 출력)
    isFullStudyCompletedOnce = localStorage.getItem('isFullStudyCompletedFlag') === 'true'; 
    
    generalModeBtn.classList.toggle('active', isGeneralMode);
    favoriteModeBtn.classList.toggle('active', !isGeneralMode);
    
    displayWord();
    console.log('[INIT] Final displayWord call after init.');

});


// --- 페이지 벗어날 때 현재 학습 정보 저장 (isCurrentDayCompleted / isFullStudyCompletedOnce 플래그 활용) ---
window.addEventListener('beforeunload', () => {
    // currentStudyDay가 null이 아닌 경우 (Day 학습 중)
    if (currentStudyDay !== null) {
        // Day 학습이 완료되지 않았다면 중단점 저장
        if (!isCurrentDayCompleted) {
            localStorage.setItem('lastInterruptedStudyDay', currentStudyDay);
            localStorage.setItem('lastInterruptedStudyIndex', currentIndex);
            console.log(`[UNLOAD] Interrupted Day session saved: Day ${currentStudyDay}, Index ${currentIndex}`);
        } else {
            console.log('[UNLOAD] Day session completed. Clearing Day interruption data.');
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
        }
        // Day 학습에서 홈으로 이동 시 다른 학습 중단점 초기화
        localStorage.removeItem('lastInterruptedFullStudyIndex');
        localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        localStorage.removeItem('isFullStudyCompletedFlag'); 
    } 
    // currentStudyDay가 null인 경우 (전체 학습 또는 즐겨찾기 모드)
    else { 
        // 일반 모드 (isGeneralMode === true) - 전체 학습
        if (isGeneralMode) {
            // 전체 학습이 한 바퀴 완료되지 않았다면 중단점 저장
            if (!isFullStudyCompletedOnce) { 
                localStorage.setItem('lastInterruptedFullStudyIndex', currentIndex);
                console.log(`[UNLOAD] Interrupted Full Study session saved: Index ${currentIndex}`);
            } else {
                console.log('[UNLOAD] Full study cycle completed. Clearing Full Study interruption data.');
                localStorage.removeItem('lastInterruptedFullStudyIndex');
                // isFullStudyCompletedFlag는 `nextBtn`에서 설정되고, `first_page.js`에서 처리될 때 지워짐.
                // 여기서는 유지 (main 페이지에서 읽을 수 있도록)
            }
            // 다른 학습 중단점 초기화
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        } 
        // 즐겨찾기 모드 (isGeneralMode === false)
        else {
            // 즐겨찾기 학습은 완료 개념이 없으므로 항상 중단점 저장
            localStorage.setItem('lastInterruptedFavoriteStudyIndex', currentIndex);
            console.log(`[UNLOAD] Interrupted Favorite Study session saved: Index ${currentIndex}`);
            // 다른 학습 중단점 초기화
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFullStudyIndex');
            localStorage.removeItem('isFullStudyCompletedFlag'); 
        }
    }
    
    // 페이지 이동 시 모든 navigateTo* 플래그 초기화
    localStorage.removeItem('currentStudyDay'); 
    localStorage.removeItem('navigateToWord'); 
    localStorage.removeItem('navigateToDay');
    localStorage.removeItem('navigateToIndex'); 
    localStorage.removeItem('navigateToFullStudyIndex'); 
    localStorage.removeItem('navigateToFavoriteStudyIndex'); 

    // isFullStudyCompletedFlag는 main 페이지에서 읽기 위해 (isGeneralMode가 true일 때만) beforeunload시 지우지 않고 유지될 수 있음.
    // 하지만 home() 함수에서 이미 `localStorage.setItem('isFullStudyCompletedFlag', 'true')` 후 `goHome()`하면
    // `first_page.js`에서 그 값을 처리하고 지우므로, 여기서는 기본적으로 지우는 로직 유지
    // 만약 `home()` 함수를 통하지 않고 그냥 탭을 닫는 경우를 대비한다면,
    // `else if (currentStudyDay === null && isGeneralMode && !isFullStudyCompletedOnce)` 분기에서 `isFullStudyCompletedFlag`를 지우지 않도록 할 수 있습니다.
    // 하지만 현재 구현상 `nextBtn`에서 완료 알림이 뜨고 `goHome()`이 호출되므로, 해당 플래그는 `first_page.js`에서 처리되는 것이 더 자연스럽습니다.
});