document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const datePicker = document.getElementById('datePicker');
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // States
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const contentState = document.getElementById('contentState');
    
    // Content Elements
    const menuList = document.getElementById('menuList');
    const calorieDisplay = document.getElementById('calorieDisplay');
    const nutritionDetails = document.getElementById('nutritionDetails');
    
    // API Constants (자운고등학교)
    const ATPT_OFCDC_SC_CODE = 'B10';
    const SD_SCHUL_CODE = '7010703';
    const API_URL = 'https://open.neis.go.kr/hub/mealServiceDietInfo';

    // Current Date State
    let currentDate = new Date();

    // Initialize
    init();

    function init() {
        setupFlatpickr();
        setupEventListeners();
        fetchMealData(formatDateForAPI(currentDate));
    }

    function setupFlatpickr() {
        const fp = flatpickr("#datePicker", {
            locale: "ko",
            disableMobile: "true", // 모바일 환경에서도 기본 캘린더 대신 flatpickr 사용
            onChange: function(selectedDates, dateStr, instance) {
                currentDate = selectedDates[0];
                updateDateDisplay();
                fetchMealData(formatDateForAPI(currentDate));
            }
        });

        document.getElementById('calendarTrigger').addEventListener('click', () => {
            fp.open();
        });
    }

    function setupEventListeners() {
        // Prev/Next Buttons
        prevBtn.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() - 1);
            updateDateDisplay();
            fetchMealData(formatDateForAPI(currentDate));
        });

        nextBtn.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() + 1);
            updateDateDisplay();
            fetchMealData(formatDateForAPI(currentDate));
        });

        // Allergy Toggle
        const allergyToggleBtn = document.getElementById('allergyToggleBtn');
        const allergyInfo = document.getElementById('allergyInfo');
        allergyToggleBtn.addEventListener('click', () => {
            allergyToggleBtn.classList.toggle('active');
            allergyInfo.classList.toggle('hidden');
        });

        // Nutrition Toggle
        const nutritionToggleBtn = document.getElementById('nutritionToggleBtn');
        nutritionToggleBtn.addEventListener('click', () => {
            nutritionToggleBtn.classList.toggle('active');
            nutritionDetails.classList.toggle('hidden');
        });
    }

    function updateDateDisplay() {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
        currentDateDisplay.textContent = currentDate.toLocaleDateString('ko-KR', options);
    }

    function formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    function cleanMenuText(rawText) {
        // Split by <br/>, remove empty items
        return rawText.split(/<br\s*\/?>/i)
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }

    async function fetchMealData(dateStr) {
        // Show Loading
        showState('loading');
        
        try {
            const url = `${API_URL}?Type=json&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${dateStr}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.mealServiceDietInfo) {
                const mealInfo = data.mealServiceDietInfo[1].row[0];
                renderMeal(mealInfo);
                showState('content');
            } else {
                showState('error');
            }
        } catch (error) {
            console.error('API Fetch Error:', error);
            showState('error');
        }
    }

    function renderMeal(mealInfo) {
        // Clear previous list
        menuList.innerHTML = '';
        
        // Render menu items
        const menuItems = cleanMenuText(mealInfo.DDISH_NM);
        menuItems.forEach((item, index) => {
            // 알레르기 숫자 부분 파싱: (1.2.3.) 혹은 (1.2.3) 형태의 텍스트를 감싸기
            const formattedItem = item.replace(/\([0-9\.]+\)/g, match => {
                return `<span class="allergy-number">${match}</span>`;
            });

            const li = document.createElement('li');
            li.className = 'menu-item';
            li.innerHTML = formattedItem; // textContent 대신 innerHTML 사용 (span 태그를 위해)
            li.style.animationDelay = `${index * 0.1}s`;
            menuList.appendChild(li);
        });

        // Render Calories
        calorieDisplay.textContent = mealInfo.CAL_INFO;

        // Render Nutrition Details (NTR_INFO 값 정리)
        if (mealInfo.NTR_INFO) {
            const cleanNtr = mealInfo.NTR_INFO.replace(/<br\s*\/?>/ig, '<br>');
            nutritionDetails.innerHTML = `<strong>[오늘의 전체 영양 정보]</strong><br><br>${cleanNtr}`;
        } else {
            nutritionDetails.innerHTML = "영양 정보가 제공되지 않았습니다.";
        }
    }

    function showState(state) {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        contentState.classList.add('hidden');

        if (state === 'loading') loadingState.classList.remove('hidden');
        if (state === 'error') errorState.classList.remove('hidden');
        if (state === 'content') contentState.classList.remove('hidden');
    }
});
