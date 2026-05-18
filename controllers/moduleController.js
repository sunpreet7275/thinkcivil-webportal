// controllers/moduleController.js
const Module = require('../models/Module');
const { handleError } = require('../middleware/errorHandler');
const messages = require('../utils/messages');

// ============ MODULE OPERATIONS (Existing) ============

const createModule = async (req, res) => {
  try {
    const { nameEnglish, nameHindi, icon, order, image } = req.body;

    if (!nameEnglish || !nameHindi || !image) {
      return res.status(400).json({ 
        message: 'Name (English & Hindi) and image are required' 
      });
    }

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
      image: image,
      icon: icon || 'bi-book',
      order: parseInt(order) || 0,
      type: 'module',
      parent: null,
      createdBy: req.user._id
    };

    const module = await Module.create(moduleData);
    
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

    if (image && image.startsWith('data:image')) {
      updateData.image = image;
    }

    const module = await Module.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id, type: 'module' },
      updateData,
      { new: true }
    );
    
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
    const modules = await Module.find({ 
      createdBy: req.user._id, 
      type: 'module',
      parent: null 
    }).sort({ order: 1, createdAt: 1 });
    
    res.json(modules);
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

const deleteModule = async (req, res) => {
  try {
    const module = await Module.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user._id,
      type: 'module'
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Delete all children recursively
    await Module.deleteRecursive(req.params.id);

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

const toggleModuleStatus = async (req, res) => {
  try {
    const module = await Module.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id, type: 'module' },
      { isActive: { $not: true } },
      { new: true }
    );
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    res.json({
      message: `Module ${module.isActive ? 'activated' : 'deactivated'} successfully`,
      module
    });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

const updateModuleOrder = async (req, res) => {
  try {
    const { order } = req.body;
    const module = await Module.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id, type: 'module' },
      { order: order },
      { new: true }
    );
    
    res.json({
      message: 'Module order updated successfully',
      module
    });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

// ============ DIRECTORY OPERATIONS (NEW) ============

// Create Folder inside Module or Folder
const createFolder = async (req, res) => {
  try {
    const { nameEnglish, nameHindi, parentId } = req.body;
    const userId = req.user._id;

    if (!nameEnglish || !parentId) {
      return res.status(400).json({ 
        message: 'Folder name and parent ID are required' 
      });
    }

    // Check if parent exists
    const parent = await Module.findOne({ 
      _id: parentId, 
      createdBy: userId,
      type: { $in: ['module', 'folder'] }
    });
    
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    // Check if folder already exists in this parent
    const existingFolder = await Module.findOne({
      parent: parentId,
      'name.english': nameEnglish,
      createdBy: userId,
      type: 'folder'
    });

    if (existingFolder) {
      return res.status(409).json({ message: 'Folder already exists' });
    }

    const folder = await Module.create({
      name: {
        english: nameEnglish,
        hindi: nameHindi || ''
      },
      type: 'folder',
      parent: parentId,
      image: parent.image,
      icon: 'bi-folder',
      order: 0,
      createdBy: userId
    });

    res.status(201).json({
      message: 'Folder created successfully',
      folder
    });
  } catch (error) {
    console.error('Create folder error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Create File inside Folder
const createFile = async (req, res) => {
  try {
    const { nameEnglish, nameHindi, parentId, fileLink, fileDescription } = req.body;
    const userId = req.user._id;

    if (!nameEnglish || !parentId || !fileLink) {
      return res.status(400).json({ 
        message: 'File name, parent ID, and file link are required' 
      });
    }

    // Check if parent exists
    const parent = await Module.findOne({ 
      _id: parentId, 
      createdBy: userId,
      type: { $in: ['module', 'folder'] }
    });
    
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    // Check if file already exists
    const existingFile = await Module.findOne({
      parent: parentId,
      'name.english': nameEnglish,
      createdBy: userId,
      type: 'file'
    });

    if (existingFile) {
      return res.status(409).json({ message: 'File already exists' });
    }

    // Determine file type
    let fileType = 'other';
    const nameLower = nameEnglish.toLowerCase();
    
    if (nameLower.endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (nameLower.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      fileType = 'image';
    } else if (nameLower.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
      fileType = 'video';
    } else if (nameLower.match(/\.(mp3|wav|ogg|flac)$/)) {
      fileType = 'audio';
    } else if (nameLower.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/)) {
      fileType = 'document';
    }

    const file = await Module.create({
      name: {
        english: nameEnglish,
        hindi: nameHindi || ''
      },
      type: 'file',
      parent: parentId,
      fileLink: fileLink,
      fileDescription: fileDescription || '',
      fileType: fileType,
      image: parent.image,
      icon: 'bi-file-earmark',
      order: 0,
      createdBy: userId
    });

    res.status(201).json({
      message: 'File created successfully',
      file
    });
  } catch (error) {
    console.error('Create file error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Get Directory Contents
const getDirectoryContents = async (req, res) => {
  try {
    const { parentId } = req.params;
    const userId = req.user._id;

    let query = { createdBy: userId };
    
    if (parentId === 'root') {
      query.type = 'module';
      query.parent = null;
    } else {
      query.parent = parentId;
    }

    const items = await Module.find(query).sort({ type: 1, order: 1, 'name.english': 1 });
    
    res.json({ items });
  } catch (error) {
    console.error('Get directory contents error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Get Single Item by ID
const getItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const item = await Module.findOne({ _id: id, createdBy: userId });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Update File
const updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { nameEnglish, nameHindi, fileLink, fileDescription } = req.body;

    const file = await Module.findOne({ 
      _id: id, 
      createdBy: userId, 
      type: 'file' 
    });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (nameEnglish) {
      file.name.english = nameEnglish;
    }
    if (nameHindi !== undefined) {
      file.name.hindi = nameHindi;
    }
    if (fileLink) {
      file.fileLink = fileLink;
      
      // Update file type
      const nameLower = nameEnglish || file.name.english;
      if (nameLower.endsWith('.pdf')) {
        file.fileType = 'pdf';
      } else if (nameLower.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
        file.fileType = 'image';
      } else if (nameLower.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
        file.fileType = 'video';
      } else if (nameLower.match(/\.(mp3|wav|ogg|flac)$/)) {
        file.fileType = 'audio';
      } else if (nameLower.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/)) {
        file.fileType = 'document';
      } else {
        file.fileType = 'other';
      }
    }
    if (fileDescription !== undefined) {
      file.fileDescription = fileDescription;
    }

    await file.save();

    res.json({
      message: 'File updated successfully',
      file
    });
  } catch (error) {
    console.error('Update file error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Rename Folder
const renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { nameEnglish, nameHindi } = req.body;

    const folder = await Module.findOne({ 
      _id: id, 
      createdBy: userId, 
      type: 'folder' 
    });
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (nameEnglish) {
      folder.name.english = nameEnglish;
    }
    if (nameHindi !== undefined) {
      folder.name.hindi = nameHindi;
    }

    await folder.save();

    // Update fullPath of all children recursively
    const updateChildrenPaths = async (parentId) => {
      const children = await Module.find({ parent: parentId });
      for (const child of children) {
        child.fullPath = `${folder.fullPath}/${child.name.english}`;
        await child.save();
        if (child.type !== 'file') {
          await updateChildrenPaths(child._id);
        }
      }
    };
    
    await updateChildrenPaths(folder._id);

    res.json({
      message: 'Folder renamed successfully',
      folder
    });
  } catch (error) {
    console.error('Rename folder error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Delete Directory Item (handles recursive deletion)
const deleteDirectoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const item = await Module.findOne({ _id: id, createdBy: userId });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.type === 'module') {
      return res.status(400).json({ 
        message: 'Use module delete endpoint for modules' 
      });
    }

    await Module.deleteRecursive(id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete directory item error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// ============ PUBLIC APIs (For Frontend Display) ============

const getAllActiveModules = async (req, res) => {
  try {
    const modules = await Module.find({ 
      isActive: true, 
      type: 'module',
      parent: null 
    }).sort({ order: 1, 'name.english': 1 });
    
    res.json(modules);
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

// Get public directory tree
const getPublicDirectoryTree = async (req, res) => {
  try {
    const { moduleId, parentId } = req.query;
    
    let query = { isActive: true };
    
    if (moduleId) {
      query.parent = parentId || moduleId;
    } else if (parentId) {
      query.parent = parentId;
    } else {
      query.type = 'module';
      query.parent = null;
    }

    const items = await Module.find(query).sort({ type: 1, order: 1, 'name.english': 1 });
    
    res.json({ items });
  } catch (error) {
    console.error('Get public directory tree error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Get full module tree
const getPublicModuleTree = async (req, res) => {
  try {
    const { id } = req.params;

    const module = await Module.findOne({ _id: id, type: 'module', isActive: true });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const getChildren = async (parentId) => {
      const children = await Module.find({ 
        parent: parentId, 
        isActive: true 
      }).sort({ type: 1, order: 1, 'name.english': 1 });
      
      for (let child of children) {
        if (child.type !== 'file') {
          child = child.toObject();
          child.children = await getChildren(child._id);
        }
      }
      
      return children;
    };

    const moduleWithTree = module.toObject();
    moduleWithTree.children = await getChildren(module._id);

    res.json({ module: moduleWithTree });
  } catch (error) {
    console.error('Get public module tree error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Get public file
const getPublicFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await Module.findOne({ _id: id, type: 'file', isActive: true });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    res.json({ file });
  } catch (error) {
    console.error('Get public file error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

module.exports = {
  // Module operations
  createModule,
  updateModule,
  getModules,
  deleteModule,
  toggleModuleStatus,
  updateModuleOrder,
  getAllActiveModules,
  // Directory operations
  createFolder,
  createFile,
  getDirectoryContents,
  getItem,
  updateFile,
  renameFolder,
  deleteDirectoryItem,
  // Public APIs
  getPublicDirectoryTree,
  getPublicModuleTree,
  getPublicFile
};