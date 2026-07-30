// controllers/liveTestController.js
const LiveTest = require('../models/liveTest');

// ============================================
// ADMIN CONTROLLERS
// ============================================

// Create a new live test
exports.createLiveTest = async (req, res) => {
  try {
    const {
      title,
      titleHi,
      type,
      subject,
      description,
      descriptionHi,
      questionPaperPDF,
      questionPaperPDFHi,
      questions,
      meetLink,
      instructions,
      startDateTime,
      endDateTime,
      duration,
      order,
      isActive
    } = req.body;

    // Validate required fields
    if (!title || !type || !subject || !meetLink || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const liveTest = new LiveTest({
      title,
      titleHi,
      type,
      subject,
      description,
      descriptionHi,
      questionPaperPDF,
      questionPaperPDFHi,
      questions: questions || [],
      meetLink,
      instructions,
      startDateTime,
      endDateTime,
      duration: duration || calculateDuration(startDateTime, endDateTime),
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?._id
    });

    await liveTest.save();

    res.status(201).json({
      success: true,
      message: 'Live test created successfully',
      data: liveTest
    });
  } catch (error) {
    console.error('Error creating live test:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating live test',
      error: error.message
    });
  }
};

// Get all live tests (admin)
exports.getAllLiveTests = async (req, res) => {
  try {
    const { search, status, fromDate, toDate, page = 1, limit = 50 } = req.query;
    
    let filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleHi: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { descriptionHi: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    
    // Date range filter
    if (fromDate || toDate) {
      filter.startDateTime = {};
      if (fromDate) filter.startDateTime.$gte = new Date(fromDate);
      if (toDate) filter.startDateTime.$lte = new Date(toDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tests, total] = await Promise.all([
      LiveTest.find(filter)
        .sort({ startDateTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LiveTest.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: tests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching live tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live tests',
      error: error.message
    });
  }
};

// Get single live test
exports.getLiveTestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const test = await LiveTest.findById(id);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Live test not found'
      });
    }

    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('Error fetching live test:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live test',
      error: error.message
    });
  }
};

// Update live test
exports.updateLiveTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Calculate duration if start and end times are provided
    if (updateData.startDateTime && updateData.endDateTime) {
      updateData.duration = calculateDuration(updateData.startDateTime, updateData.endDateTime);
    }

    const test = await LiveTest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Live test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Live test updated successfully',
      data: test
    });
  } catch (error) {
    console.error('Error updating live test:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating live test',
      error: error.message
    });
  }
};

// Toggle live test status
exports.toggleLiveTestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const test = await LiveTest.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Live test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Live test ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: test
    });
  } catch (error) {
    console.error('Error toggling live test status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling live test status',
      error: error.message
    });
  }
};

// Delete live test
exports.deleteLiveTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await LiveTest.findByIdAndDelete(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Live test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Live test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting live test:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting live test',
      error: error.message
    });
  }
};

// ============================================
// STUDENT CONTROLLERS
// ============================================

// Get available tests for students
// controllers/liveTestController.js

// Get available tests for students
exports.getAvailableTests = async (req, res) => {
  try {
    const now = new Date();
    
    // Get all active tests
    const tests = await LiveTest.find({
      isActive: true
    }).sort({ startDateTime: 1 });

    // Add status to each test
    const testsWithStatus = tests.map(test => {
      const testObj = test.toObject();
      const start = new Date(test.startDateTime);
      const end = new Date(test.endDateTime);
      
      if (now >= start && now <= end) {
        testObj.status = 'available';
        testObj.isAvailable = true;
        testObj.isUpcoming = false;
        testObj.isExpired = false;
      } else if (now < start) {
        testObj.status = 'upcoming';
        testObj.isAvailable = false;
        testObj.isUpcoming = true;
        testObj.isExpired = false;
      } else {
        testObj.status = 'expired';
        testObj.isAvailable = false;
        testObj.isUpcoming = false;
        testObj.isExpired = true;
      }
      
      return testObj;
    });

    res.status(200).json({
      success: true,
      data: testsWithStatus
    });
  } catch (error) {
    console.error('Error fetching available tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available tests',
      error: error.message
    });
  }
};

// Get only currently available tests (active and within date range)
exports.getCurrentlyAvailableTests = async (req, res) => {
  try {
    const now = new Date();
    
    const tests = await LiveTest.find({
      isActive: true,
      startDateTime: { $lte: now },
      endDateTime: { $gte: now }
    }).sort({ startDateTime: 1 });

    const testsWithStatus = tests.map(test => {
      const testObj = test.toObject();
      testObj.status = 'available';
      testObj.isAvailable = true;
      testObj.isUpcoming = false;
      testObj.isExpired = false;
      return testObj;
    });

    res.status(200).json({
      success: true,
      data: testsWithStatus
    });
  } catch (error) {
    console.error('Error fetching currently available tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching currently available tests',
      error: error.message
    });
  }
};

// Get upcoming tests for students
exports.getUpcomingTests = async (req, res) => {
  try {
    const now = new Date();
    
    const tests = await LiveTest.find({
      isActive: true,
      startDateTime: { $gt: now }
    }).sort({ startDateTime: 1 });

    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (error) {
    console.error('Error fetching upcoming tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming tests',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}