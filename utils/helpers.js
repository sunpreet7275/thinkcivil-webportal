const jwt = require('jsonwebtoken');
const { JWT, USER_TYPES } = require('../config/constants');

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT.SECRET, { expiresIn: JWT.EXPIRES_IN });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT.SECRET, { expiresIn: JWT.REFRESH_EXPIRES_IN });
};

const getMenuItems = (user) => {
  const commonItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' }
  ];

  const role = user.role;
  const type = user.type;

  // Admin menu (no type needed)
  if (role === 'admin') {
    return [
      ...commonItems,
      { name: 'Manage Tests', path: '/manage-tests', icon: 'settings' },
      { name: 'Results & Analytics', path: '/admin-results', icon: 'analytics' },
      { name: 'Syllabus Master', path: '/syllabus-master', icon: 'menu_book' },
      { name: 'Tag Master', path: '/tag-master', icon: 'local_offer' },
      { name: 'Question Master', path: '/questions-master', icon: 'quiz' },
      { name: 'Pre Resources Directory', path: '/directory-master', icon: 'library_books' },
      { name: 'Meeting Master', path: '/meeting-admin', icon: 'groups' },
      { name: 'Mentorship Plans', path: '/admin-mentorship', icon: 'school' },
      { name: 'Announcement Master', path: '/announcement-master', icon: 'campaign' },
      { name: 'Free Resource', path: '/free-resource-admin', icon: 'inventory_2' }

    ];
  }

  // Student menus based on type
  if (role === 'student') {
    switch (type) {
      case USER_TYPES.FRESH:
        return [
          ...commonItems,
          // { name: 'My Profile', path: '/profile', icon: 'person' },
          // { name: 'Upgrade Plan', path: '/upgrade', icon: 'upgrade' }
        ];

      case USER_TYPES.PRE:
        return [
          ...commonItems,
          { name: 'Prelims Tests', path: '/prelims-tests', icon: 'quiz' },
          { name: 'Prelims Results', path: '/prelims-results', icon: 'assignment' },
          { name: 'Resources', path: '/pre-materials', icon: 'library_books' },
          { name: 'Mentorship Sessions', path: '/pre-session', icon: 'groups' },

          // { name: 'Test History', path: '/test-history', icon: 'history' },
          // { name: 'Current Affairs', path: '/current-affairs', icon: 'article' }
        ];

      case USER_TYPES.MAINS:
        return [
          ...commonItems,
          { name: 'Mains Tests', path: '/mains-tests', icon: 'description' },
          { name: 'Answer Writing', path: '/answer-writing', icon: 'edit_note' },
          { name: 'Mains Results', path: '/mains-results', icon: 'assignment' },
          { name: 'Test History', path: '/test-history', icon: 'history' },
          { name: 'Study Materials', path: '/materials', icon: 'library_books' },
          { name: 'Essay Practice', path: '/essay-practice', icon: 'create' },
          { name: 'Optional Subject', path: '/optional', icon: 'menu_book' }
        ];

      case USER_TYPES.COMBO:
        return [
          ...commonItems,
          { name: 'Prelims Tests', path: '/prelims-tests', icon: 'quiz' },
          { name: 'Mains Tests', path: '/mains-tests', icon: 'description' },
          { name: 'Answer Writing', path: '/answer-writing', icon: 'edit_note' },
          { name: 'My Results', path: '/results', icon: 'assignment' },
          { name: 'Test History', path: '/test-history', icon: 'history' },
          { name: 'Study Materials', path: '/materials', icon: 'library_books' },
          { name: 'Video Lectures', path: '/videos', icon: 'ondemand_video' },
          { name: 'Doubt Solving', path: '/doubts', icon: 'help' },
          { name: 'Current Affairs', path: '/current-affairs', icon: 'article' }
        ];

      default:
        return commonItems;
    }
  }

  return commonItems;
};

const calculateRanking = (results, studentId) => {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return { rank: 1, totalStudents: 0 };
  }

  // Create a copy to avoid mutating the original array
  const resultsCopy = [...results];
  
  // Sort by score (descending) and then by submission time (ascending - earlier submissions get better rank)
  const sortedResults = resultsCopy.sort((a, b) => {
    // First sort by score (descending)
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // If scores are equal, sort by submission time (earlier first)
    return new Date(a.submittedAt) - new Date(b.submittedAt);
  });

  console.log('📊 Ranking Calculation:', {
    totalResults: sortedResults.length,
    studentId: studentId.toString(),
    sortedScores: sortedResults.map(r => ({ score: r.score, student: r.student._id.toString() }))
  });

  // Find the student's rank (1-based index)
  const rankIndex = sortedResults.findIndex(result => {
    const student = result.student;
    // Handle both populated student object and student ID string
    if (student && typeof student === 'object' && student._id) {
      return student._id.toString() === studentId.toString();
    } else {
      return student.toString() === studentId.toString();
    }
  });

  const rank = rankIndex >= 0 ? rankIndex + 1 : sortedResults.length + 1;

  console.log('🎯 Final Rank:', { rank, totalStudents: sortedResults.length });

  return {
    rank: rank,
    totalStudents: sortedResults.length
  };
};

const formatTestForStudent = (test) => ({
  _id: test._id,
  title: test.title,
  description: test.description,
  startTime: test.startTime,
  endTime: test.endTime,
  duration: test.duration,
  marksPerQuestion: test.marksPerQuestion,
  negativeMarks: test.negativeMarks,
  totalQuestions: test.questions.length,
  totalMarks: test.totalMarks, // Use the virtual property
  status: test.status,
  introPage: test.introPage
});

module.exports = {
  generateToken,
  generateRefreshToken,
  getMenuItems,
  calculateRanking,
  formatTestForStudent
};