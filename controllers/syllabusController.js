const Syllabus = require('../models/Syllabus');
const { handleError } = require('../middleware/errorHandler');

// Create or Update Prelims Syllabus
const createOrUpdatePrelims = async (req, res) => {
  try {
    // Deactivate any existing active prelims syllabus FIRST
    await Syllabus.updateMany(
      { type: 'prelims', isActive: true },
      { isActive: false }
    );

    // Check if any prelims syllabus exists (active or inactive)
    let existingSyllabus = await Syllabus.findOne({ type: 'prelims' });

    if (existingSyllabus) {
      // Update existing syllabus
      const updatedSyllabus = await Syllabus.findByIdAndUpdate(
        existingSyllabus._id,
        {
          prelims: req.body,
          type: 'prelims',
          isActive: true,
          createdBy: req.user._id
        },
        { new: true, runValidators: true }
      );

      return res.json({
        message: 'Prelims syllabus updated successfully',
        syllabus: updatedSyllabus.prelims,
        action: 'updated'
      });
    } else {
      // Create new syllabus
      const syllabus = new Syllabus({
        prelims: req.body,
        type: 'prelims',
        isActive: true,
        createdBy: req.user._id
      });

      await syllabus.save();

      return res.status(201).json({
        message: 'Prelims syllabus created successfully',
        syllabus: syllabus.prelims,
        action: 'created'
      });
    }
  } catch (error) {
    console.error('Prelims syllabus error:', error);
    handleError(res, error, 'Failed to process prelims syllabus');
  }
};



// Get Prelims Syllabus
const getPrelimsSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findOne({ type: 'prelims', isActive: true })
      .select('prelims')
      .lean();

    if (!syllabus || !syllabus.prelims) {
      return res.status(404).json({ 
        message: 'No active prelims syllabus found' 
      });
    }

    res.json(syllabus.prelims);
  } catch (error) {
    handleError(res, error, 'Failed to fetch prelims syllabus');
  }
};

const createOrUpdateMains = async (req, res) => {
  try {
    // First, deactivate ALL active mains syllabus
    await Syllabus.updateMany(
      { type: 'mains', isActive: true },
      { $set: { isActive: false } }
    );

    // Now find any mains syllabus (active or inactive)
    let existingSyllabus = await Syllabus.findOne({ type: 'mains' });

    let syllabus;
    if (existingSyllabus) {
      // Update existing syllabus
      syllabus = await Syllabus.findByIdAndUpdate(
        existingSyllabus._id,
        {
          $set: {
            mains: req.body,
            isActive: true,
            createdBy: req.user._id
          }
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new syllabus
      syllabus = new Syllabus({
        mains: req.body,
        type: 'mains',
        isActive: true,
        createdBy: req.user._id
      });
      await syllabus.save();
    }

    // Remove _id fields from the response
    const cleanSyllabus = JSON.parse(JSON.stringify(syllabus.mains));
    removeIds(cleanSyllabus);

    return res.json({
      message: 'Mains syllabus created successfully',
      syllabus: cleanSyllabus,
      action: existingSyllabus ? 'updated' : 'created'
    });
  } catch (error) {
    console.error('Mains syllabus error:', error);
    handleError(res, error, 'Failed to process mains syllabus');
  }
};

// Helper function to remove _id fields
const removeIds = (obj) => {
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      delete item._id;
      if (typeof item === 'object' && item !== null) {
        removeIds(item);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    delete obj._id;
    Object.values(obj).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        removeIds(value);
      }
    });
  }
};

// Get Mains Syllabus - Clean response
const getMainsSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findOne({ type: 'mains', isActive: true })
      .select('mains')
      .lean();

    if (!syllabus || !syllabus.mains) {
      return res.status(404).json({ 
        message: 'No active mains syllabus found' 
      });
    }

    // Remove _id fields
    removeIds(syllabus.mains);

    res.json(syllabus.mains);
  } catch (error) {
    handleError(res, error, 'Failed to fetch mains syllabus');
  }
};

module.exports = {
  createOrUpdatePrelims,
  createOrUpdateMains,
  getPrelimsSyllabus,
  getMainsSyllabus
};