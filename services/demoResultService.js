const DemoResult = require('../models/DemoResult');
const DemoTest = require('../models/DemoTest');
const Question = require('../models/Question');

class DemoResultService {
  static async submitDemoTest(testId, studentId, answers, timeTaken) {
    // Get test with populated questions
    const test = await DemoTest.findById(testId)
      .populate({
        path: 'questions',
        select: 'uid correctAnswer'
      });
    
    if (!test) throw new Error('Demo test not found');
    
    // Check if test is active
    if (!test.isActive) {
      throw new Error('This demo test is no longer active');
    }

    // Validate that we have questions populated
    if (!test.questions || test.questions.length === 0) {
      throw new Error('No questions found for this demo test');
    }

    // Validate that answers count matches questions count
    if (answers.length !== test.questionUids.length) {
      throw new Error(`Expected ${test.questionUids.length} answers, but got ${answers.length}`);
    }

    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unattempted = 0;

    // Create a map of questions by UID for easy lookup
    const questionMap = {};
    test.questions.forEach(question => {
      questionMap[question.uid] = question;
    });

    const evaluatedAnswers = answers.map((answer, index) => {
      const questionUid = test.questionUids[index];
      const question = questionMap[questionUid];
      
      if (!question) {
        throw new Error(`Question with UID ${questionUid} not found`);
      }

      // Convert to number for consistent comparison
      const selectedOption = parseInt(answer.selectedOption);
      const correctAnswer = parseInt(question.correctAnswer);
      
      // Check if question was attempted (-1 means unattempted)
      const isAttempted = !isNaN(selectedOption) && selectedOption >= 0 && selectedOption <= 3;
      
      const isCorrect = isAttempted && (selectedOption === correctAnswer);
      
      let marksForThisQuestion = 0;
      
      if (isAttempted) {
        if (isCorrect) {
          marksForThisQuestion = test.marksPerQuestion;
          correctAnswers++;
        } else {
          marksForThisQuestion = -test.negativeMarks;
          wrongAnswers++;
        }
      } else {
        unattempted++;
      }
      
      score += marksForThisQuestion;
      
      return {
        questionUid: questionUid,
        questionIndex: index,
        selectedOption: answer.selectedOption,
        isCorrect,
        isAttempted,
        correctAnswer: question.correctAnswer,
        marksObtained: parseFloat(marksForThisQuestion.toFixed(2))
      };
    });

    // Ensure score doesn't go below zero
    score = Math.max(0, parseFloat(score.toFixed(2)));
    
    const totalMarks = test.totalMarks;
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    const result = await DemoResult.create({
      test: testId,
      student: studentId,
      answers: evaluatedAnswers,
      score,
      totalMarks,
      percentage,
      timeTaken,
      submittedAt: new Date(),
      summary: {
        totalQuestions: test.questionUids.length,
        correctAnswers,
        wrongAnswers,
        unattempted,
        marksPerQuestion: test.marksPerQuestion,
        negativeMarks: test.negativeMarks
      }
    });

    return { 
      result, 
      score, 
      totalMarks, 
      percentage,
      summary: {
        totalQuestions: test.questionUids.length,
        correctAnswers,
        wrongAnswers,
        unattempted,
        marksPerQuestion: parseFloat(test.marksPerQuestion.toFixed(2)),
        negativeMarks: parseFloat(test.negativeMarks.toFixed(2))
      }
    };
  }

  static async getStudentDemoResults(studentId) {
    return await DemoResult.find({ student: studentId })
      .populate('test', 'title duration marksPerQuestion negativeMarks')
      .sort({ submittedAt: -1 });
  }

  static async getStudentDemoTestResult(testId, studentId) {
    return await DemoResult.findOne({ test: testId, student: studentId })
      .populate({
        path: 'test',
        select: 'title description duration marksPerQuestion negativeMarks questionUids',
        populate: {
          path: 'questions',
          select: 'uid question description options correctAnswer tags',
          populate: {
            path: 'tags',
            select: 'tag'
          }
        }
      })
      .populate('student', 'fullName email');
  }

  static async getDemoResultById(resultId) {
    return await DemoResult.findById(resultId)
      .populate('test', 'title questionUids marksPerQuestion negativeMarks')
      .populate('student', 'fullName email');
  }

  static async canTakeDemoTest(testId, studentId) {
    // Check if test exists and is active
    const test = await DemoTest.findById(testId);
    if (!test || !test.isActive) {
      return { canTake: false, reason: 'Demo test is not available' };
    }

    // Check if student has already taken this demo test
    const existingResult = await DemoResult.findOne({ test: testId, student: studentId });
    if (existingResult) {
      return { 
        canTake: false, 
        reason: 'You have already taken this demo test',
        submittedAt: existingResult.submittedAt
      };
    }

    return { canTake: true, reason: 'Demo test is available' };
  }
}

module.exports = DemoResultService;