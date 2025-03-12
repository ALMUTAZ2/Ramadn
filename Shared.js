  const QUIZ_CONFIG = {
      START_HOUR: 19, // 7 مساءً
      END_HOUR: 20,  // 8 مساءً
      QUESTIONS_PER_DAY: 3,
      TIME_PER_QUESTION: 10,
  };

  function isQuizTime() {
      const now = new Date();
      const hour = now.getHours();
      return hour >= QUIZ_CONFIG.START_HOUR && hour < QUIZ_CONFIG.END_HOUR;
  }

  function isLeaderboardTime() {
      const now = new Date();
      const hour = now.getHours();
      return hour >= QUIZ_CONFIG.END_HOUR || hour < QUIZ_CONFIG.START_HOUR;
  }

  function formatTime(seconds) {
      if (seconds < 60) {
          return `${seconds} ثانية`;
      } else {
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return `${minutes} دقيقة و ${remainingSeconds} ثانية`;
      }
  }

  function getNextQuizTime() {
      const now = new Date();
      const today19 = new Date(now);
      today19.setHours(19, 0, 0, 0);
      
      if (now.getHours() >= QUIZ_CONFIG.END_HOUR) {
          today19.setDate(today19.getDate() + 1);
      }
      
      const diffMs = today19 - now;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
          hours: diffHrs,
          minutes: diffMins,
          totalMinutes: diffHrs * 60 + diffMins
      };
  }

  function hasParticipatedToday() {
      try {
          const scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
          const today = new Date().toISOString().split('T')[0];
          const deviceId = ensureDeviceId();
          return scores.some(score => 
              score.date.startsWith(today) && 
              score.deviceId === deviceId
          );
      } catch (error) {
          console.error('Error checking participation:', error);
          return false;
      }
  }

  function ensureDeviceId() {
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
          deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('deviceId', deviceId);
      }
      return deviceId;
  }

  function saveQuizResult(result) {
      try {
          const scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
          const today = new Date().toISOString().split('T')[0];
          
          const filteredScores = scores.filter(score => score.date.startsWith(today));
          
          filteredScores.push({
              ...result,
              date: new Date().toISOString(),
              deviceId: ensureDeviceId()
          });
          
          localStorage.setItem('quizScores', JSON.stringify(filteredScores));
          return true;
      } catch (error) {
          console.error('Error saving quiz result:', error);
          return false;
      }
  }

  function getTodayScores() {
      try {
          const scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
          const today = new Date().toISOString().split('T')[0];
          
          return scores
              .filter(score => score.date.startsWith(today))
              .sort((a, b) => {
                  if (b.points !== a.points) return b.points - a.points;
                  return a.totalTime - b.totalTime;
              });
      } catch (error) {
          console.error('Error getting today scores:', error);
          return [];
      }
  }

  function getQuizStatus() {
      const now = new Date();
      const hour = now.getHours();
      const nextQuizTime = getNextQuizTime();
      
      if (hasParticipatedToday()) {
          return {
              canParticipate: false,
              message: 'لقد شاركت اليوم بالفعل',
              subMessage: 'يمكنك المشاركة مرة أخرى غداً',
              timeMessage: `سيتم إعلان المتصدرين الساعة ${QUIZ_CONFIG.END_HOUR} مساءً`
          };
      }
      
      if (hour < QUIZ_CONFIG.START_HOUR) {
          return {
              canParticipate: false,
              message: `المسابقة ستبدأ الساعة ${QUIZ_CONFIG.START_HOUR} مساءً`,
              subMessage: `متبقي ${nextQuizTime.hours} ساعة و ${nextQuizTime.minutes} دقيقة`,
              timeMessage: `سيتم إعلان المتصدرين الساعة ${QUIZ_CONFIG.END_HOUR} مساءً`
          };
      } else if (hour >= QUIZ_CONFIG.START_HOUR && hour < QUIZ_CONFIG.END_HOUR) {
          return {
              canParticipate: true,
              message: 'المسابقة متاحة الآن!',
              subMessage: 'شارك الآن للحصول على أعلى النقاط',
              timeMessage: `سيتم إعلان المتصدرين الساعة ${QUIZ_CONFIG.END_HOUR} مساءً`
          };
      } else {
          return {
              canParticipate: false,
              message: `المسابقة متاحة غداً من ${QUIZ_CONFIG.START_HOUR} مساءً`,
              subMessage: `متبقي ${nextQuizTime.hours} ساعة و ${nextQuizTime.minutes} دقيقة`,
              timeMessage: 'يمكنك مشاهدة نتائج اليوم في صفحة المتصدرين'
          };
      }
  }
