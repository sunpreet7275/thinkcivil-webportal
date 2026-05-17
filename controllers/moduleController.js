// controllers/moduleController.js
const ModuleService = require('../services/moduleService');
const { handleError } = require('../middleware/errorHandler');
const messages = require('../utils/messages');

// Admin APIs
// controllers/moduleController.js
const createModule = async (req, res) => {
  try {
    const { nameEnglish, nameHindi, icon, order, image } = req.body;

    // Validate required fields
    if (!nameEnglish || !nameHindi || !image) {
      return res.status(400).json({ 
        message: 'Name (English & Hindi) and image are required' 
      });
    }

    // Validate base64 image
    if (!image.startsWith('data:image')) {
      return res.status(400).json({ 
        message: 'Invalid image format. Must be base64 encoded image' 
      });
    }

    const moduleData = {
      name: {
        english: nameEnglish,
        hindi: nameHindi
      },
      image: image, // Store full base64 string
      icon: icon || 'bi-book',
      order: parseInt(order) || 0,
      createdBy: req.user._id
    };

    const module = await ModuleService.createModule(moduleData);
    
    res.status(201).json({
      message: 'Module created successfully',
      module
    });
  } catch (error) {
    console.error('Module creation error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

const updateModule = async (req, res) => {
  try {
    const { nameEnglish, nameHindi, icon, order, image } = req.body;

    const updateData = {
      name: {
        english: nameEnglish,
        hindi: nameHindi
      },
      icon: icon,
      order: parseInt(order) || 0
    };

    // Only update image if a new one is provided
    if (image && image.startsWith('data:image')) {
      updateData.image = image;
    }

    const module = await ModuleService.updateModule(req.params.id, updateData);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json({
      message: 'Module updated successfully',
      module
    });
  } catch (error) {
    console.error('Module update error:', error);
    handleError(res, error, messages.en.serverError);
  }
};


const getModules = async (req, res) => {
  try {
    const modules = await ModuleService.getModulesByCreator(req.user._id);
    res.json(modules);
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

// const updateModule = async (req, res) => {
//   try {
//     const module = await ModuleService.updateModule(req.params.id, req.body);
//     if (!module) {
//       return res.status(404).json({ message: 'Module not found' });
//     }

//     res.json({
//       message: 'Module updated successfully',
//       module
//     });
//   } catch (error) {
//     handleError(res, error, messages.en.serverError);
//   }
// };

const deleteModule = async (req, res) => {
  try {
    const module = await ModuleService.deleteModule(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

const toggleModuleStatus = async (req, res) => {
  try {
    const module = await ModuleService.toggleModuleStatus(req.params.id);
    
    res.json({
      message: `Module ${module.isActive ? 'activated' : 'deactivated'} successfully`,
      module: {
        _id: module._id,
        name: module.name,
        isActive: module.isActive
      }
    });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

// Public API for frontend
const getAllActiveModules = async (req, res) => {
  try {
    const modules = await ModuleService.getAllModules();
    res.json(modules);
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

const updateModuleOrder = async (req, res) => {
  try {
    const { order } = req.body;
    const module = await ModuleService.updateModuleOrder(req.params.id, order);
    
    res.json({
      message: 'Module order updated successfully',
      module
    });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

module.exports = {
  createModule,
  getModules,
  updateModule,
  deleteModule,
  toggleModuleStatus,
  getAllActiveModules,
  updateModuleOrder
};