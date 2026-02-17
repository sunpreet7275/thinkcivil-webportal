// controllers/couponController.js
const Coupon = require('../models/Coupon');
const { handleError } = require('../middleware/errorHandler');

// Validate and apply coupon
const validateCoupon = async (req, res) => {
  try {
    const { code, planId, userId, amount } = req.body;
    
    // Find active coupon
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or expired coupon code' 
      });
    }

    // Check if coupon is applicable for this plan
    if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planId)) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not applicable for the selected plan'
      });
    }

    // Check global usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has reached its maximum usage limit'
      });
    }

    // Check per-user usage limit
    if (userId) {
      const userUsage = coupon.usedBy.filter(entry => 
        entry.user.toString() === userId
      ).length;
      
      if (userUsage >= coupon.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: `You have already used this coupon ${coupon.perUserLimit} time(s)`
        });
      }
    }

    // Check minimum purchase amount
    if (amount && amount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (amount * coupon.discountValue) / 100;
      // Apply max discount limit if set
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, amount);
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
        isFree: coupon.isFree,
        discountAmount: Math.round(discountAmount)
      }
    });

  } catch (error) {
    handleError(res, error, 'Coupon validation failed');
  }
};

// Admin: Create new coupon
const createCoupon = async (req, res) => {
  try {
    const couponData = req.body;
    
    // Generate random code for free coupons if not provided
    if (couponData.isFree && !couponData.code) {
      couponData.code = Coupon.generateFreeCoupon();
    }

    const coupon = new Coupon({
      ...couponData,
      createdBy: req.user._id
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error) {
    handleError(res, error, 'Failed to create coupon');
  }
};

// Admin: Update coupon
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error) {
    handleError(res, error, 'Failed to update coupon');
  }
};

// Admin: Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Coupon.countDocuments(filter);

    res.json({
      coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch coupons');
  }
};

// Admin: Get single coupon
const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('usedBy.user', 'name email');

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json(coupon);
  } catch (error) {
    handleError(res, error, 'Failed to fetch coupon');
  }
};

// Admin: Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    handleError(res, error, 'Failed to delete coupon');
  }
};

module.exports = {
  validateCoupon,
  createCoupon,
  updateCoupon,
  getAllCoupons,
  getCouponById,
  deleteCoupon
};