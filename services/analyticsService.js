const Test = require('../models/Test');
const Result = require('../models/Result');
const User = require('../models/User');
const Question = require('../models/Question');

class AnalyticsService {
  static async getTestAnalytics(testId) {
    // Get test with populated questions
    const test = await Test.findById(testId)
      .populate({
        path: 'questions',
        select: 'uid question description options correctAnswer'
      });
    
    if (!test) throw new Error('Test not found');

    const results = await Result.find({ test: testId }).populate('student', 'fullName email');
    const totalStudents = results.length;
    
    const scores = results.map(r => r.score);
    const averageScore = totalStudents > 0 ? scores.reduce((sum, score) => sum + score, 0) / totalStudents : 0;
    const highestScore = totalStudents > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalStudents > 0 ? Math.min(...scores) : 0;
    const averageTime = totalStudents > 0 ? results.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / totalStudents : 0;

    // Create a map of questions by UID for easy lookup
    const questionMap = {};
    test.questions.forEach(question => {
      questionMap[question.uid] = question;
    });

    const questionStats = test.questionUids.map((questionUid, index) => {
      const question = questionMap[questionUid];
      
      // Count correct answers for this question
      const correctAnswers = results.filter(result => {
        const answer = result.answers.find(ans => ans.questionUid === questionUid);
        return answer && answer.isCorrect;
      }).length;

      return {
        questionIndex: index + 1,
        question: question ? question.question : { english: 'Question not found', hindi: '' },
        description: question ? question.description : { english: '', hindi: '' },
        options: question ? question.options : [],
        correctAnswer: question ? question.correctAnswer : -1,
        correctAnswers,
        incorrectAnswers: totalStudents - correctAnswers,
        correctPercentage: totalStudents > 0 ? (correctAnswers / totalStudents) * 100 : 0
      };
    });

    return {
      testTitle: test.title,
      testDescription: test.description,
      totalQuestions: test.questionUids.length,
      totalStudents,
      averageScore: averageScore.toFixed(2),
      highestScore: highestScore.toFixed(2),
      lowestScore: lowestScore.toFixed(2),
      averageTime: Math.round(averageTime),
      marksPerQuestion: test.marksPerQuestion,
      negativeMarks: test.negativeMarks,
      questionStats,
      performanceDistribution: this.calculatePerformanceDistribution(results)
    };
  }

  static async getPlatformStatistics() {
    const totalTests = await Test.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalResults = await Result.countDocuments();
    
    const recentResults = await Result.find()
      .populate('test', 'title')
      .populate('student', 'fullName')
      .sort({ submittedAt: -1 })
      .limit(10);

    const activeTests = await Test.countDocuments({ 
      isActive: true,
      startTime: { $lte: new Date() },
      $expr: {
        $gt: [
          { $add: ["$startTime", { $multiply: ["$duration", 60000] }] },
          new Date()
        ]
      }
    });

    return {
      totalTests,
      totalStudents,
      totalResults,
      activeTests,
      recentResults: recentResults.map(result => ({
        studentName: result.student.fullName,
        testTitle: result.test.title,
        score: result.score,
        totalMarks: result.totalMarks,
        submittedAt: result.submittedAt
      }))
    };
  }

  static calculatePerformanceDistribution(results) {
    if (!results || results.length === 0) {
      return {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0
      };
    }

    return {
      excellent: results.filter(r => (r.score / r.totalMarks) >= 0.8).length,
      good: results.filter(r => (r.score / r.totalMarks) >= 0.6 && (r.score / r.totalMarks) < 0.8).length,
      average: results.filter(r => (r.score / r.totalMarks) >= 0.4 && (r.score / r.totalMarks) < 0.6).length,
      poor: results.filter(r => (r.score / r.totalMarks) < 0.4).length
    };
  }
}

module.exports = AnalyticsService;