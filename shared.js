// تكوين المسابقة
const QUIZ_CONFIG = {
    START_HOUR: 19,        // وقت بدء المسابقة (7 مساءً)
    END_HOUR: 20,         // وقت انتهاء المسابقة (8 مساءً)
    QUESTIONS_PER_DAY: 3, // عدد الأسئلة اليومية
    TIME_PER_QUESTION: 10, // الوقت المخصص لكل سؤال (بالثواني)
    MIN_NAME_LENGTH: 3,    // الحد الأدنى لطول اسم المشترك
    MAX_NAME_LENGTH: 20    // الحد الأقصى لطول اسم المشترك
};

// التحقق من وقت المسابقة
function isQuizTime() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= QUIZ_CONFIG.START_HOUR && hour < QUIZ_CONFIG.END_HOUR;
}

// التحقق من وقت عرض المتصدرين
function isLeaderboardTime() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= QUIZ_CONFIG.END_HOUR || hour < QUIZ_CONFIG.START_HOUR;
}

// الحصول على حالة المسابقة
function getQuizStatus() {
    if (!isQuizTime()) {
        const nextQuizTime = getNextQuizTime();
        return {
            canParticipate: false,
            message: "المسابقة متوقفة حالياً",
            subMessage: isLeaderboardTime() ? "يمكنك مشاهدة المتصدرين" : "انتظر بدء المسابقة",
            timeMessage: `المسابقة القادمة تبدأ في ${formatTimeRemaining(nextQuizTime)}`
        };
    }

    if (hasParticipatedToday()) {
        return {
            canParticipate: false,
            message: "لقد شاركت في مسابقة اليوم",
            subMessage: "يمكنك المشاركة غداً",
            timeMessage: "نتمنى لك التوفيق في المسابقة القادمة"
        };
    }

    return {
        canParticipate: true,
        message: "المسابقة متاحة الآن!",
        subMessage: "شارك وكن من المتصدرين",
        timeMessage: "المسابقة جارية"
    };
}

// حساب النقاط
function calculatePoints(timeSpent, isCorrect) {
    if (!isCorrect || timeSpent === null) return 0;
    
    if (timeSpent <= 1) return 1000;
    if (timeSpent <= 3) return 800;
    if (timeSpent <= 5) return 500;
    if (timeSpent <= 7) return 200;
    if (timeSpent <= 10) return 100;
    return 0;
}

// إنشاء معرف فريد للمستخدم
function ensureDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// الحصول على وقت المسابقة القادمة
function getNextQuizTime() {
    const now = new Date();
    const nextQuiz = new Date();
    
    if (now.getHours() >= QUIZ_CONFIG.END_HOUR) {
        nextQuiz.setDate(nextQuiz.getDate() + 1);
    }
    
    nextQuiz.setHours(QUIZ_CONFIG.START_HOUR, 0, 0, 0);
    return nextQuiz;
}

// تنسيق الوقت المتبقي
function formatTimeRemaining(date) {
    const now = new Date();
    const diff = date - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// حفظ نتيجة السؤال
function saveQuestionResult(questionNumber, answer, timeSpent, isCorrect) {
    const points = calculatePoints(timeSpent, isCorrect);
    const result = {
        questionNumber,
        answer,
        timeSpent: timeSpent || QUIZ_CONFIG.TIME_PER_QUESTION,
        isCorrect,
        points,
        status: timeSpent === null ? 'لم يتم الإجابة' : 
                isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة',
        timestamp: new Date().toISOString()
    };
    
    const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
    results.push(result);
    localStorage.setItem('quizResults', JSON.stringify(results));
    
    return result;
}

// حفظ النتيجة النهائية
function saveFinalResult(playerName, totalPoints, answers) {
    const result = {
        playerName,
        deviceId: ensureDeviceId(),
        totalPoints,
        answers,
        date: new Date().toISOString(),
        quizDay: new Date().getDate()
    };

    const dailyResults = JSON.parse(localStorage.getItem('dailyResults') || '[]');
    dailyResults.push(result);
    localStorage.setItem('dailyResults', JSON.stringify(dailyResults));

    return result;
}

// التحقق من المشاركة السابقة
function hasParticipatedToday() {
    const deviceId = ensureDeviceId();
    const dailyResults = JSON.parse(localStorage.getItem('dailyResults') || '[]');
    const today = new Date().getDate();
    
    return dailyResults.some(result => 
        result.deviceId === deviceId && 
        new Date(result.date).getDate() === today
    );
}

// جلب نتائج اليوم
function getTodayScores() {
    const dailyResults = JSON.parse(localStorage.getItem('dailyResults') || '[]');
    const today = new Date().getDate();
    
    return dailyResults
        .filter(result => new Date(result.date).getDate() === today)
        .sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            const aTime = a.answers.reduce((sum, ans) => sum + ans.timeSpent, 0);
            const bTime = b.answers.reduce((sum, ans) => sum + ans.timeSpent, 0);
            return aTime - bTime;
        });
}

// تنظيف البيانات القديمة
function cleanOldData() {
    const dailyResults = JSON.parse(localStorage.getItem('dailyResults') || '[]');
    const today = new Date().getDate();
    
    const filteredResults = dailyResults.filter(result => 
        new Date(result.date).getDate() === today
    );
    
    localStorage.setItem('dailyResults', JSON.stringify(filteredResults));
}

// تصدير الدوال
export {
    QUIZ_CONFIG,
    isQuizTime,
    isLeaderboardTime,
    getQuizStatus,
    calculatePoints,
    getNextQuizTime,
    formatTimeRemaining,
    ensureDeviceId,
    saveQuestionResult,
    saveFinalResult,
    getTodayScores,
    hasParticipatedToday,
    cleanOldData
};
