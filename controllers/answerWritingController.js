const AnswerWriting = require('../models/AnswerWriting');
const StudentAnswerSubmission = require('../models/StudentAnswerSubmission');
const { handleError } = require('../middleware/errorHandler');

// Helper function to get bilingual content
const getBilingualContent = (item, lang) => {
  if (!item) return null;
  const obj = item.toObject ? item.toObject() : { ...item };
  
  if (lang === 'hi') {
    return {
      ...obj,
      name: obj.nameHi || obj.name,
      description: obj.descriptionHi || obj.description,
      questions: obj.questions?.map(q => ({
        ...q,
        questionText: q.questionTextHi || q.questionText
      })),
      questionPaperPDF: obj.questionPaperPDFHi || obj.questionPaperPDF
    };
  }
  return obj;
};

// @desc    Create a new answer writing exercise
// @route   POST /api/answer-writing
// @access  Private/Admin
const createAnswerWriting = async (req, res) => {
  try {
    const {
      name,
      nameHi,
      description,
      descriptionHi,
      questions,
      questionPaperPDF,
      questionPaperPDFHi,
      startDateTime,
      endDateTime,
      order
    } = req.body;

    if (!name || !description || !questions || !questions.length || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, questions, start date time, and end date time are required'
      });
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date time must be after start date time'
      });
    }

    const existingExercise = await AnswerWriting.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingExercise) {
      return res.status(400).json({
        success: false,
        message: 'An exercise with this name already exists'
      });
    }

    const processedQuestions = questions.map(q => ({
      questionText: q.questionText,
      questionTextHi: q.questionTextHi || '',
    }));

    const answerWriting = new AnswerWriting({
      name,
      nameHi: nameHi || '',
      description,
      descriptionHi: descriptionHi || '',
      questions: processedQuestions,
      questionPaperPDF: questionPaperPDF || '',
      questionPaperPDFHi: questionPaperPDFHi || '',
      startDateTime: start,
      endDateTime: end,
      order: order || 0,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await answerWriting.save();

    res.status(201).json({
      success: true,
      message: 'Answer writing exercise created successfully',
      data: answerWriting
    });

  } catch (error) {
    console.error('Create answer writing error:', error);
    handleError(res, error, 'Failed to create answer writing exercise');
  }
};

// @desc    Get all answer writing exercises (admin view)
// @route   GET /api/answer-writing/admin
// @access  Private/Admin
// In answerWritingController.js
const getAllAnswerWritingAdmin = async (req, res) => {
  try {
    const { search, status, fromDate, toDate, lang = 'en' } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameHi: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { descriptionHi: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    // Date range filter
    if (fromDate || toDate) {
      query.startDateTime = {};
      if (fromDate) {
        query.startDateTime.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.startDateTime.$lte = new Date(toDate);
      }
    }

    const exercises = await AnswerWriting.find(query)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .sort({ order: -1, createdAt: -1 });

    const data = exercises.map(ex => getBilingualContent(ex, lang));

    res.json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('Get all answer writing error:', error);
    handleError(res, error, 'Failed to fetch exercises');
  }
};

// @desc    Get available exercises for students
// @route   GET /api/answer-writing/available
// @access  Private (Student)
// @desc    Get available exercises for students
// @route   GET /api/answer-writing/available
// @access  Private (Student)
const getAvailableExercises = async (req, res) => {
  try {
    const { lang = 'en' } = req.query;
    const now = new Date();
    
    // Get user's submissions first to know which exercises are already submitted
    const userSubmissions = await StudentAnswerSubmission.find({
      studentId: req.user._id
    });
    
    const submittedExerciseIds = userSubmissions.map(sub => sub.answerWritingId.toString());
    
    // Find exercises that are:
    // 1. Active
    // 2. Not expired (endDateTime >= now)
    // 3. Not already submitted by the student
    const exercises = await AnswerWriting.find({ 
      isActive: true,
      endDateTime: { $gte: now },
      _id: { $nin: submittedExerciseIds } // Exclude already submitted exercises
    })
      .select('-createdBy -updatedBy -__v')
      .sort({ order: -1, startDateTime: 1 });

    // Process each exercise based on time restrictions
    const exercisesWithStatus = exercises.map(exercise => {
      const exerciseObj = getBilingualContent(exercise, lang);
      
      // Check if exercise is available (between start and end date)
      const isAvailable = exercise.isAvailable;
      const isUpcoming = exercise.isUpcoming;
      const isExpired = exercise.isExpired;
      
      // IMPORTANT: Only show questions if exercise is currently available
      if (isAvailable) {
        // Show full questions and PDF links
        exerciseObj.questions = exercise.questions;
        exerciseObj.questionPaperPDF = exercise.questionPaperPDF;
        exerciseObj.questionPaperPDFHi = exercise.questionPaperPDFHi;
      } else {
        // Hide questions and PDF links if not within time window
        exerciseObj.questions = [];
        exerciseObj.questionPaperPDF = '';
        exerciseObj.questionPaperPDFHi = '';
        // Add a message for students
        exerciseObj.message = isUpcoming 
          ? (lang === 'hi' ? 'प्रश्न ' + new Date(exercise.startDateTime).toLocaleString() + ' को उपलब्ध होंगे' : 'Questions will be available on ' + new Date(exercise.startDateTime).toLocaleString())
          : (lang === 'hi' ? 'यह अभ्यास समाप्त हो चुका है' : 'This exercise has expired');
      }
      
      exerciseObj.status = 'pending';
      exerciseObj.isAvailable = isAvailable;
      exerciseObj.isUpcoming = isUpcoming;
      exerciseObj.isExpired = isExpired;
      exerciseObj.startDateTime = exercise.startDateTime;
      exerciseObj.endDateTime = exercise.endDateTime;
      
      return exerciseObj;
    });

    res.json({
      success: true,
      count: exercisesWithStatus.length,
      data: exercisesWithStatus
    });

  } catch (error) {
    console.error('Get available exercises error:', error);
    handleError(res, error, 'Failed to fetch exercises');
  }
};

// @desc    Get single exercise by ID with student's submission
// @route   GET /api/answer-writing/:id
// @access  Private
const getAnswerWritingById = async (req, res) => {
  try {
    const { lang = 'en' } = req.query;
    const exercise = await AnswerWriting.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    const exerciseObj = getBilingualContent(exercise, lang);
    
    if (req.user.role !== 'admin') {
      const submission = await StudentAnswerSubmission.findOne({
        answerWritingId: exercise._id,
        studentId: req.user._id
      });
      
      exerciseObj.userSubmission = submission;
      exerciseObj.hasSubmitted = !!submission;
    }

    res.json({
      success: true,
      data: exerciseObj
    });

  } catch (error) {
    console.error('Get exercise by ID error:', error);
    handleError(res, error, 'Failed to fetch exercise');
  }
};

// @desc    Update answer writing exercise
// @route   PUT /api/answer-writing/:id
// @access  Private/Admin
const updateAnswerWriting = async (req, res) => {
  try {
    const exercise = await AnswerWriting.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    if (req.body.name && req.body.name !== exercise.name) {
      const existingExercise = await AnswerWriting.findOne({
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: exercise._id }
      });

      if (existingExercise) {
        return res.status(400).json({
          success: false,
          message: 'An exercise with this name already exists'
        });
      }
    }

    if (req.body.startDateTime && req.body.endDateTime) {
      const start = new Date(req.body.startDateTime);
      const end = new Date(req.body.endDateTime);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'End date time must be after start date time'
        });
      }
    }

    const updates = {};
    const updateableFields = ['name', 'nameHi', 'description', 'descriptionHi', 'questions', 'questionPaperPDF', 'questionPaperPDFHi', 'startDateTime', 'endDateTime', 'isActive', 'order'];
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDateTime' || field === 'endDateTime') {
          updates[field] = new Date(req.body[field]);
        } else if (field === 'questions') {
          updates[field] = req.body[field].map(q => ({
            questionText: q.questionText,
            questionTextHi: q.questionTextHi || ''
          }));
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    updates.updatedBy = req.user._id;

    const updatedExercise = await AnswerWriting.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Exercise updated successfully',
      data: updatedExercise
    });

  } catch (error) {
    console.error('Update exercise error:', error);
    handleError(res, error, 'Failed to update exercise');
  }
};

// @desc    Delete answer writing exercise (HARD DELETE - also deletes all submissions)
// @route   DELETE /api/answer-writing/:id
// @access  Private/Admin
const deleteAnswerWriting = async (req, res) => {
  try {
    const exercise = await AnswerWriting.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Delete all submissions for this exercise
    const deletedSubmissions = await StudentAnswerSubmission.deleteMany({ answerWritingId: exercise._id });
    
    // Delete the exercise
    await exercise.deleteOne();

    res.json({
      success: true,
      message: `Exercise deleted successfully. ${deletedSubmissions.deletedCount} submissions also deleted.`,
      data: {
        exerciseDeleted: true,
        submissionsDeleted: deletedSubmissions.deletedCount
      }
    });

  } catch (error) {
    console.error('Delete exercise error:', error);
    handleError(res, error, 'Failed to delete exercise');
  }
};

// @desc    Toggle exercise status
// @route   PATCH /api/answer-writing/:id/toggle-status
// @access  Private/Admin
const toggleExerciseStatus = async (req, res) => {
  try {
    const exercise = await AnswerWriting.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    exercise.isActive = !exercise.isActive;
    exercise.updatedBy = req.user._id;
    await exercise.save();

    const status = exercise.isActive ? 'activated' : 'deactivated';

    res.json({
      success: true,
      message: `Exercise ${status} successfully`,
      data: exercise
    });

  } catch (error) {
    console.error('Toggle exercise status error:', error);
    handleError(res, error, 'Failed to toggle exercise status');
  }
};

// @desc    Submit answers for an exercise (student)
// @route   POST /api/answer-writing/:id/submit
// @access  Private (Student)
const submitAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const studentId = req.user._id;

    const exercise = await AnswerWriting.findById(id);
    if (!exercise || !exercise.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found or not active'
      });
    }

    const now = new Date();
    if (now < exercise.startDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Submission has not started yet'
      });
    }

    const existingSubmission = await StudentAnswerSubmission.findOne({
      answerWritingId: id,
      studentId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted for this exercise'
      });
    }

    if (!answers || !answers.length) {
      return res.status(400).json({
        success: false,
        message: 'Please submit answers for at least one question'
      });
    }

    const isLate = now > exercise.endDateTime;
    
    const processedAnswers = answers.map(answer => ({
      questionId: answer.questionId,
      answerPDF: answer.answerPDF,
      language: answer.language || 'en',
      submittedAt: now
    }));

    const submission = new StudentAnswerSubmission({
      answerWritingId: id,
      studentId,
      answers: processedAnswers,
      isLate,
      submittedAt: now,
      submissionLanguage: answers[0]?.language || 'en'
    });

    await submission.save();

    res.status(201).json({
      success: true,
      message: isLate ? 'Answers submitted successfully (Late Submission)' : 'Answers submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Submit answers error:', error);
    handleError(res, error, 'Failed to submit answers');
  }
};

// @desc    Get student's submissions
// @route   GET /api/answer-writing/my-submissions
// @access  Private (Student)
// @desc    Get student's submissions
// @route   GET /api/answer-writing/my-submissions
// @access  Private (Student)
const getMySubmissions = async (req, res) => {
  try {
    const { lang = 'en' } = req.query;
    const submissions = await StudentAnswerSubmission.find({ studentId: req.user._id })
      .populate('answerWritingId', 'name nameHi description descriptionHi questions questionPaperPDF questionPaperPDFHi startDateTime endDateTime')
      .sort({ submittedAt: -1 });

    const data = submissions.map(sub => {
      const subObj = sub.toObject();
      const exercise = subObj.answerWritingId;
      
      if (exercise) {
        // Process bilingual content for exercise
        if (lang === 'hi') {
          exercise.name = exercise.nameHi || exercise.name;
          exercise.description = exercise.descriptionHi || exercise.description;
          exercise.questionPaperPDF = exercise.questionPaperPDFHi || exercise.questionPaperPDF;
        }
        
        // Add full question details to each answer
        if (exercise.questions && exercise.questions.length) {
          subObj.answers = subObj.answers.map(answer => {
            const question = exercise.questions.find(q => q._id.toString() === answer.questionId.toString());
            if (question) {
              answer.questionText = lang === 'hi' 
                ? (question.questionTextHi || question.questionText) 
                : question.questionText;
              answer.questionTextHi = question.questionTextHi;
              answer.fullQuestion = question; // Include full question object if needed
            }
            return answer;
          });
        }
      }
      
      return subObj;
    });

    res.json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('Get my submissions error:', error);
    handleError(res, error, 'Failed to fetch submissions');
  }
};

// @desc    Get all submissions for an exercise (admin)
// @route   GET /api/answer-writing/:id/submissions
// @access  Private/Admin
const getExerciseSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    const submissions = await StudentAnswerSubmission.find({ answerWritingId: id })
      .populate('studentId', 'fullName email phone')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });

  } catch (error) {
    console.error('Get exercise submissions error:', error);
    handleError(res, error, 'Failed to fetch submissions');
  }
};

module.exports = {
  createAnswerWriting,
  getAllAnswerWritingAdmin,
  getAvailableExercises,
  getAnswerWritingById,
  updateAnswerWriting,
  deleteAnswerWriting,
  toggleExerciseStatus,
  submitAnswers,
  getMySubmissions,
  getExerciseSubmissions
};