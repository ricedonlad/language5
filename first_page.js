// ====== Global Variables & DOM Elements (First Page) ======
let words = []; // 첫 페이지에서 단어 데이터를 로드하여 스케줄 계산에 사용
let currentWordsPerDay = 0; // 하루 학습 단어 수

// 데이터 관리 DOM 요소
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importFile = document.getElementById('importFile');
const importBtn = document.getElementById('importBtn');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const confirmImportBtn = document.getElementById('confirmImportBtn');

// 스케줄 관련 DOM 요소
const overallScheduleDisplay = document.getElementById('overallScheduleDisplay');
const dailyScheduleButtonsContainer = document.getElementById('dailyScheduleButtons');
const adjustScheduleBtn = document.getElementById('adjustScheduleBtn');

// 학습 시작 버튼
const startStudyBtn = document.getElementById('startStudyBtn'); // 텍스트는 HTML에서 변경

// 단어 추가 관련 DOM 요소
const newForeignWordInput = document.getElementById('newForeignWord'); // 이제 textarea
const newMeaningInput = document.getElementById('newMeaning'); // 이제 textarea
const addWordBtn = document.getElementById('addWordBtn');

// 찾기 기능 관련 DOM 요소
const searchTermInput = document.getElementById('searchTerm');
const searchBtn = document.getElementById('searchBtn');
const searchResultsContainer = document.getElementById('searchResults');


// ====== Functions (Shared or First Page Specific) ======

/**
 * localStorage에서 단어 데이터를 로드합니다.
 * @returns {Array} 로드된 단어 배열 또는 샘플 데이터
 */
function loadWords() {
    const storedWords = localStorage.getItem('foreignWords');
    if (storedWords) {
        try {
            const parsedWords = JSON.parse(storedWords);
            console.log('Words loaded from localStorage (first_page.js). Total:', parsedWords.length);
            return parsedWords;
        } catch (e) {
            console.error('Error parsing words from localStorage (first_page.js):', e);
            // 파싱 오류 발생 시 기본 샘플 데이터 반환
            return getDefaultSampleWords();
        }
    } else {
        console.log('No words found in localStorage. Using sample data (first_page.js).');
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
    console.log('Words saved to localStorage (first_page.js). Total:', words.length);
}

/**
 * 데이터를 파일로 다운로드하는 범용 함수
 * @param {string} data - 다운로드할 데이터 문자열
 * @param {string} filename - 파일 이름 (예: my_words.csv)
 * @param {string} type - MIME 타입 (예: text/csv, application/json)
 */
function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // 메모리 해제
    alert(`${filename} 파일이 다운로드되었습니다.`);
}

/**
 * 스케줄을 계산하여 화면에 표시하고 localStorage에 저장합니다.
 * 각 단어에 학습 일자를 할당하고, 날짜별 버튼을 생성합니다.
 * @param {number} totalWordsCount - 현재 단어의 총 개수
 * @param {boolean} promptUser - 사용자에게 하루 학습 단어 수를 물어볼지 여부
 */
function calculateAndDisplaySchedule(totalWordsCount, promptUser = false) {
    let storedWordsPerDay = localStorage.getItem('scheduleWordsPerDay');
    if (promptUser || !storedWordsPerDay || isNaN(parseInt(storedWordsPerDay))) {
        currentWordsPerDay = promptForWordsPerDay(); // 사용자에게 하루 학습 단어 수 요청
        if (currentWordsPerDay === null) { // 사용자가 취소했거나 유효하지 않은 값 입력
            currentWordsPerDay = parseInt(localStorage.getItem('scheduleWordsPerDay') || '1'); // 기존 값 유지 또는 기본값 1
            if (currentWordsPerDay === 0 && totalWordsCount > 0) currentWordsPerDay = 1; // 단어 있는데 0이면 1로 보정
        }
    } else {
        currentWordsPerDay = parseInt(storedWordsPerDay);
    }

    // 하루 학습 단어 수가 0이거나 유효하지 않으면 1로 보정 (단어가 있을 경우)
    if (totalWordsCount > 0 && currentWordsPerDay < 1) {
        currentWordsPerDay = 1;
        localStorage.setItem('scheduleWordsPerDay', currentWordsPerDay);
    } else if (totalWordsCount === 0) { // 단어가 없으면 하루 학습 단어 수도 0으로
        currentWordsPerDay = 0;
    }
    
    localStorage.setItem('scheduleWordsPerDay', currentWordsPerDay); // 유효한 값 저장

    // 총 Day 수 계산: 총 단어 수 / 하루 학습 단어 수 (올림)
    let daysToStudy = (totalWordsCount > 0 && currentWordsPerDay > 0) ? Math.ceil(totalWordsCount / currentWordsPerDay) : 0;

    dailyScheduleButtonsContainer.innerHTML = ''; // 기존 버튼 모두 제거

    if (totalWordsCount === 0) {
        overallScheduleDisplay.textContent = '단어가 없거나 하루 학습 단어 수가 설정되지 않았습니다.';
        localStorage.removeItem('completedDays');
        words.forEach(word => word.day = undefined); // 단어가 없으면 Day 정보도 초기화
        saveWords();
        return;
    }
    
    // 단어에 학습 Day 할당 (모든 단어를 다시 할당하여 정합성 유지)
    // words 배열을 기존 순서대로 재정렬 (혹시 모를 뒤섞임 방지)
    // 현재는 단어 추가 시 push만 하므로 정렬 필요 없지만, 데이터 로드 시 순서가 중요할 수 있어 주석 처리된 정렬 로직은 유지하거나 고유 ID로 대체 고려
    /*
    words.sort((a, b) => {
        const dayA = a.day === undefined ? Infinity : a.day;
        const dayB = b.day === undefined ? Infinity : b.day;

        if (dayA !== dayB) {
            return dayA - dayB;
        }
        return 0;
    });
    */


    let wordIndex = 0;
    words.forEach(word => {
        // currentWordsPerDay가 0이면 Day 할당하지 않음 (단어가 없거나 설정이 안된 경우)
        word.day = (currentWordsPerDay > 0) ? Math.floor(wordIndex / currentWordsPerDay) + 1 : undefined;
        wordIndex++;
    });
    saveWords(); // 할당된 day 정보와 함께 words 배열 저장
    
    overallScheduleDisplay.textContent = `총 ${totalWordsCount}개의 단어, ${daysToStudy}일 동안 하루 약 ${currentWordsPerDay}개씩 학습`;

    // 날짜별 버튼 생성 및 표시
    const completedDays = JSON.parse(localStorage.getItem('completedDays') || '{}');
    let allDaysCompleted = true;
    for (let day = 1; day <= daysToStudy; day++) {
        const dayBtn = document.createElement('button');
        dayBtn.textContent = `Day ${day}`;
        dayBtn.dataset.day = day;
        
        if (completedDays[`day${day}`]) {
            dayBtn.classList.add('completed');
        } else {
            allDaysCompleted = false;
        }
        dayBtn.addEventListener('click', () => {
            localStorage.setItem('currentStudyDay', day); // Day 학습 모드임을 명시
            // Day 버튼 클릭 시에는 모든 학습 이력 초기화 (항상 해당 Day의 처음부터 시작하도록)
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFullStudyIndex'); 
            localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
            localStorage.removeItem('isFullStudyCompletedFlag'); // 전체 학습 완료 플래그도 클리어
            localStorage.removeItem('navigateToWord'); 
            localStorage.removeItem('navigateToFullStudyIndex'); 
            localStorage.removeItem('navigateToFavoriteStudyIndex');
            window.location.href = 'study.html';
        });
        dailyScheduleButtonsContainer.appendChild(dayBtn);
    }

    // 모든 Day가 완료되었는지 확인하고 팝업 표시
    if (totalWordsCount > 0 && allDaysCompleted && daysToStudy > 0) { 
        alert('축하합니다! 모든 학습 과정을 완료했습니다!');
        // 모든 학습이 완료되면, completedDays 및 이어서 학습할 정보도 지웁니다.
        localStorage.removeItem('completedDays'); 
        localStorage.removeItem('lastInterruptedStudyDay');
        localStorage.removeItem('lastInterruptedStudyIndex');
        localStorage.removeItem('lastInterruptedFullStudyIndex');
        localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        localStorage.removeItem('isFullStudyCompletedFlag'); // 전체 학습 완료 플래그도 클리어

        // 버튼 상태 초기화
        dailyScheduleButtonsContainer.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('completed');
        });
        overallScheduleDisplay.textContent = `총 ${totalWordsCount}개의 단어, ${daysToStudy}일 동안 하루 약 ${currentWordsPerDay}개씩 학습 (모든 학습 완료! 다시 시작하려면 스케줄을 조정하거나 새 단어를 추가하세요.)`;
    }
}

/**
 * 사용자에게 하루 학습 단어 수를 묻는 팝업을 띄우고 유효한 값을 반환합니다.
 */
function promptForWordsPerDay() {
    let wordsPerDay = null;
    let input = prompt('하루에 몇 개의 단어를 학습할까요? (숫자로 입력)');
    if (input !== null) {
        wordsPerDay = parseInt(input.trim());
        if (isNaN(wordsPerDay) || wordsPerDay <= 0) {
            alert('유효한 숫자를 입력해주세요. (1개 이상)');
            return null; // 유효하지 않은 값
        }
    }
    return wordsPerDay;
}

/**
 * textarea의 높이를 내용에 맞게 자동으로 조절합니다.
 * @param {HTMLElement} element - 높이를 조절할 textarea 요소
 */
function autoGrowTextarea(element) {
    element.style.height = 'auto'; // 높이 초기화
    element.style.height = (element.scrollHeight) + 'px'; // scrollHeight에 맞춰 높이 설정
}

/**
 * 새로운 단어를 추가합니다.
 */
function addWord() {
    const foreign = newForeignWordInput.value.trim();
    const meaning = newMeaningInput.value.trim();

    if (foreign && meaning) {
        // 기존 단어의 foreignLang과 day 속성을 유지하는 것이 합리적 (CSV/JSON import 시)
        // 새로운 단어는 기본값으로 추가
        words.push({ foreign, meaning, isFavorite: false, foreignLang: 'en-US', day: undefined }); 
        saveWords(); 

        calculateAndDisplaySchedule(words.length, false); 

        newForeignWordInput.value = '';
        newMeaningInput.value = '';
        // 높이도 초기화 (텍스트가 비었으므로)
        autoGrowTextarea(newForeignWordInput);
        autoGrowTextarea(newMeaningInput);
        alert('단어가 추가되었습니다! 스케줄이 업데이트되었습니다.');
    } else {
        alert('외국어 단어와 의미를 모두 입력해주세요.');
    }
}


/**
 * 단어를 검색하고 결과를 표시합니다.
 */
function searchWords() {
    const searchTerm = searchTermInput.value.trim().toLowerCase();
    searchResultsContainer.innerHTML = ''; 

    if (searchTerm.length < 2) { 
        searchResultsContainer.innerHTML = '<p>최소 두 글자 이상 입력해주세요.</p>';
        searchTermInput.value = ''; 
        return;
    }

    const results = words.filter(word =>
        word.foreign.toLowerCase().includes(searchTerm) ||
        word.meaning.toLowerCase().includes(searchTerm)
    );

    if (results.length === 0) {
        searchResultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
    } else {
        results.forEach(word => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('search-result-item');
            resultItem.innerHTML = `
                <span class="search-word-foreign">${word.foreign}</span>
                <span class="search-word-meaning">${word.meaning}</span>
                ${word.day ? `<span class="search-word-day">(Day ${word.day})</span>` : ''}
            `;
            resultItem.addEventListener('click', () => {
                localStorage.setItem('navigateToWord', JSON.stringify(word));
                // 검색 결과로 이동 시, 모든 이전 학습 이력 초기화
                localStorage.removeItem('lastInterruptedStudyDay');
                localStorage.removeItem('lastInterruptedStudyIndex');
                localStorage.removeItem('lastInterruptedFullStudyIndex');
                localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
                localStorage.removeItem('isFullStudyCompletedFlag');
                localStorage.removeItem('currentStudyDay'); // 검색 결과는 Day 학습 모드가 아님
                localStorage.removeItem('navigateToFullStudyIndex'); // 전체 학습 이동 정보도 클리어 (혹시 모를 충돌 방지)
                localStorage.removeItem('navigateToFavoriteStudyIndex');
                window.location.href = 'study.html';
            });
            searchResultsContainer.appendChild(resultItem);
        });
    }
    searchTermInput.value = '';
}


// ====== Event Listeners (First Page Specific) ======

// CSV 내보내기
exportCsvBtn.addEventListener('click', () => {
    if (words.length === 0) {
        alert('내보낼 단어가 없습니다.');
        return;
    }
    let csvContent = "외국어,의미,즐겨찾기,외국어언어코드,학습일차\n"; 
    words.forEach(word => {
        const foreign = `"${(word.foreign || '').replace(/"/g, '""')}"`;
        const meaning = `"${(word.meaning || '').replace(/"/g, '""')}"`;
        const isFavorite = word.isFavorite ? 'TRUE' : 'FALSE';
        const foreignLang = word.foreignLang || '';
        const day = word.day || ''; 
        csvContent += `${foreign},${meaning},${isFavorite},${foreignLang},${day}\n`;
    });
    downloadFile(csvContent, 'my_foreign_words.csv', 'text/csv;charset=utf-8;');
});

// JSON 내보내기
exportJsonBtn.addEventListener('click', () => {
    if (words.length === 0) {
        alert('내보낼 단어가 없습니다.');
        return;
    }
    const jsonContent = JSON.stringify(words, null, 2);
    downloadFile(jsonContent, 'my_foreign_words.json', 'application/json;charset=utf-8;');
});

// 파일 가져오기 (파일 선택 버튼 클릭)
importBtn.addEventListener('click', () => {
    importFile.click();
});

// 파일 선택 시 파일명 표시
importFile.addEventListener('change', () => {
    if (importFile.files.length > 0) {
        fileNameDisplay.textContent = importFile.files[0].name; 
        confirmImportBtn.style.display = 'block';
    } else {
        fileNameDisplay.textContent = '파일 선택 안됨';
        confirmImportBtn.style.display = 'none';
    }
});

// 파일 불러오기 (확인 버튼 클릭)
confirmImportBtn.addEventListener('click', () => {
    if (importFile.files.length === 0) {
        alert('먼저 파일을 선택해주세요.');
        return;
    }

    const file = importFile.files[0]; 
    const reader = new FileReader();

    reader.onload = (e) => {
        console.log('FileReader onload triggered for import.');
        const fileContent = e.target.result;
        let importedData = [];
        let success = false;

        if (file.name.endsWith('.json')) {
            try {
                importedData = JSON.parse(fileContent);
                if (Array.isArray(importedData) && importedData.every(item => 
                    typeof item.foreign === 'string' && typeof item.meaning === 'string' &&
                    (typeof item.isFavorite === 'boolean' || item.isFavorite === undefined) &&
                    (typeof item.foreignLang === 'string' || item.foreignLang === undefined) &&
                    (typeof item.day === 'number' || item.day === undefined) 
                )) {
                    importedData = importedData.map(item => ({
                        foreign: item.foreign,
                        meaning: item.meaning,
                        isFavorite: item.isFavorite === true,
                        foreignLang: item.foreignLang || 'en-US',
                        day: item.day || undefined 
                    }));
                    success = true;
                    console.log('JSON parsed successfully:', importedData);
                } else {
                    alert('JSON 파일 형식이 올바르지 않습니다. "foreign", "meaning" 키가 포함된 배열이어야 합니다. (isFavorite, foreignLang, day은 선택 사항)');
                    console.error('JSON data validation failed:', importedData);
                }
            } catch (error) {
                alert('JSON 파일을 파싱하는 데 오류가 발생했습니다: ' + error.message);
                console.error('JSON parsing error:', error);
            }
        } else if (file.name.endsWith('.csv')) {
            try {
                const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length > 1) {
                    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); 
                    
                    const foreignIdx = headers.indexOf('외국어');
                    const meaningIdx = headers.indexOf('의미');
                    const isFavoriteIdx = headers.indexOf('즐겨찾기');
                    const foreignLangIdx = headers.indexOf('외국어언어코드');
                    const dayIdx = headers.indexOf('학습일차'); 

                    if (foreignIdx === -1 || meaningIdx === -1) {
                        alert('CSV 파일에 필수 컬럼("외국어", "의미")이 없습니다.');
                        console.error('CSV headers missing: required "외국어", "의미". Found:', headers);
                        success = false;
                    } else {
                        importedData = [];
                        for (let i = 1; i < lines.length; i++) {
                            const line = lines[i];
                            if (line.trim() === '') continue; 

                            const row = [];
                            let inQuote = false;
                            let currentField = '';
                            for (let j = 0; j < line.length; j++) {
                                const char = line[j];
                                if (char === '"') {
                                    if (inQuote && j + 1 < line.length && line[j+1] === '"') { 
                                        currentField += '"';
                                        j++;
                                    } else {
                                        inQuote = !inQuote;
                                    }
                                } else if (char === ',' && !inQuote) {
                                    row.push(currentField);
                                    currentField = '';
                                } else {
                                    currentField += char;
                                }
                            }
                            row.push(currentField); 

                            const cleanField = (field) => {
                                if (field === undefined || field === null) return ''; 
                                return String(field).trim().replace(/^"|"$/g, ''); 
                            };
                            
                            const newWord = {
                                foreign: cleanField(row[foreignIdx]),
                                meaning: cleanField(row[meaningIdx]),
                                isFavorite: cleanField(row[isFavoriteIdx])?.toLowerCase() === 'true',
                                foreignLang: cleanField(row[foreignLangIdx]) || 'en-US',
                                day: dayIdx !== -1 && !isNaN(parseInt(cleanField(row[dayIdx]))) ? parseInt(cleanField(row[dayIdx])) : undefined
                            };
                            if (newWord.foreign !== '' && newWord.meaning !== '') {
                                importedData.push(newWord);
                            }
                        }
                        success = true;
                        console.log('CSV parsed successfully:', importedData);
                    }
                } else {
                    alert('CSV 파일에 유효한 데이터가 없습니다. 헤더와 최소 한 줄의 데이터가 필요합니다.');
                    console.error('CSV file has no valid data rows.');
                }
            } catch (error) {
                alert('CSV 파일을 파싱하는 데 오류가 발생했습니다. 형식을 확인해주세요: ' + error.message);
                console.error('CSV parsing error:', error);
            }
        } else {
            alert('지원되지 않는 파일 형식입니다. .csv 또는 .json 파일을 선택해주세요.');
        }

        if (success) {
            if (confirm(`현재 ${words.length}개의 단어 데이터를 불러온 ${importedData.length}개의 단어 데이터로 덮어쓰시겠습니까? (현재 데이터는 사라집니다.)`)) {
                words = importedData;
                saveWords(); 
                localStorage.removeItem('completedDays'); 
                // 데이터 새로 불러오면 모든 학습 이력 초기화
                localStorage.removeItem('lastInterruptedStudyDay');
                localStorage.removeItem('lastInterruptedStudyIndex');
                localStorage.removeItem('lastInterruptedFullStudyIndex');
                localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
                localStorage.removeItem('isFullStudyCompletedFlag');
                calculateAndDisplaySchedule(words.length, true); 
                alert('데이터가 성공적으로 불러와졌습니다!');
            }
        }
        importFile.value = '';
        fileNameDisplay.textContent = '파일 선택 안됨';
        confirmImportBtn.style.display = 'none';
    };

    reader.onerror = () => {
        alert('파일을 읽는 데 오류가 발생했습니다.');
        console.error('File reading error:', reader.error);
    };

    reader.readAsText(file);
});

// 스케줄 조정 버튼
adjustScheduleBtn.addEventListener('click', () => {
    calculateAndDisplaySchedule(words.length, true); // 현재 단어 수를 기반으로 스케줄 재조정 (true로 사용자에게 물어보기)
});

// 학습 시작 버튼
startStudyBtn.addEventListener('click', () => {
    if (words.length === 0) {
        alert('학습할 단어가 없습니다. 단어를 추가하거나 가져와주세요.');
        return;
    }

    const isFullStudyCompletedFlag = localStorage.getItem('isFullStudyCompletedFlag') === 'true';
    const lastInterruptedFullStudyIndex = localStorage.getItem('lastInterruptedFullStudyIndex');
    
    // 1. 전체 학습 완료 플래그가 설정된 경우
    if (isFullStudyCompletedFlag) {
        alert('모든 학습이 완료되었으니 처음부터 다시 시작합니다.');
        localStorage.removeItem('isFullStudyCompletedFlag'); // 완료 플래그 초기화
        localStorage.removeItem('lastInterruptedFullStudyIndex'); // 중단점 초기화
        localStorage.setItem('navigateToFullStudyIndex', '0'); // 처음부터 시작하도록 지시
        console.log('Starting full study from beginning (completed previous cycle).');
    } 
    // 2. 중간에 중단된 전체 학습 기록이 있는 경우
    else if (lastInterruptedFullStudyIndex !== null) {
        const confirmResume = confirm(`이전 전체 학습 ( ${parseInt(lastInterruptedFullStudyIndex, 10) + 1}번째 단어)을 이어서 하시겠습니까?\n(아니오를 선택하시면 처음부터 다시 시작합니다.)`);

        if (confirmResume) {
            localStorage.setItem('navigateToFullStudyIndex', lastInterruptedFullStudyIndex);
            console.log(`Resuming full study from index: ${lastInterruptedFullStudyIndex}`);
        } else {
            localStorage.removeItem('lastInterruptedFullStudyIndex'); // 처음부터 시작
            localStorage.setItem('navigateToFullStudyIndex', '0'); // 처음부터 시작하도록 지시
            console.log('Starting full study from beginning (user choice).');
        }
    } 
    // 3. 아무런 기록이 없는 경우 (처음 시작)
    else {
        localStorage.setItem('navigateToFullStudyIndex', '0'); // 처음부터 시작하도록 지시
        console.log('No interrupted full study session found. Starting from beginning.');
    }

    // 모든 학습 관련 localStorage 키 초기화 (학습 타입 간 충돌 방지)
    localStorage.removeItem('lastInterruptedStudyDay');
    localStorage.removeItem('lastInterruptedStudyIndex');
    localStorage.removeItem('lastInterruptedFavoriteStudyIndex'); // 즐겨찾기 중단점도 클리어
    localStorage.removeItem('navigateToWord'); 
    localStorage.removeItem('navigateToDay');
    localStorage.removeItem('navigateToIndex');
    localStorage.removeItem('navigateToFavoriteStudyIndex'); // 즐겨찾기 이동 정보도 클리어

    localStorage.setItem('currentStudyDay', null); // 전체 학습 모드임을 study_page.js에 알림
    localStorage.removeItem('generalModeIndex'); // 전체 학습은 시작 시 항상 처음 또는 이어서로 시작하므로 일반/즐겨찾기 인덱스 클리어
    localStorage.removeItem('favoriteModeIndex');
    window.location.href = 'study.html'; // 학습 페이지로 이동
});

// 단어 추가 버튼 이벤트 리스너
addWordBtn.addEventListener('click', addWord);

// textarea의 높이를 내용에 맞게 자동으로 조절하는 함수
function autoGrowTextarea(element) {
    element.style.height = 'auto'; // 높이 초기화
    element.style.height = (element.scrollHeight) + 'px'; // scrollHeight에 맞춰 높이 설정
}

// 새로운 단어 입력 필드에 input 이벤트 리스너 연결
newForeignWordInput.addEventListener('input', () => autoGrowTextarea(newForeignWordInput));
newMeaningInput.addEventListener('input', () => autoGrowTextarea(newMeaningInput));

// 초기 로드 시 textarea 높이 조절
window.addEventListener('load', () => {
    // 기존 로드 로직 (words = loadWords(); calculateAndDisplaySchedule(words.length, false);) 후에 실행
    autoGrowTextarea(newForeignWordInput);
    autoGrowTextarea(newMeaningInput);
});


// 검색 버튼 이벤트 리스너
searchBtn.addEventListener('click', searchWords);
// 엔터 키 입력 시 검색 실행 (검색 입력 필드)
searchTermInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWords();
    }
});


// ====== Initialization (First Page) ======
window.addEventListener('load', () => {
    words = loadWords(); 
    calculateAndDisplaySchedule(words.length, false); 
});