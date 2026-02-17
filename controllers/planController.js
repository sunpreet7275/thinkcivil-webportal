// controllers/planController.js
const { PLANS } = require('../config/plans');

const getPlans = async (req, res) => {
  try {
    // Convert plans object to array format for frontend
    const plans = Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      baseAmount: plan.baseAmount,
      totalAmount: plan.totalAmount, // GST already included
      duration: plan.duration,
      features: plan.features
    }));

    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      message: 'Failed to fetch plans', 
      error: error.message 
    });
  }
};

const getPlanDetails = async (req, res) => {
  try {
    const { planName } = req.params;
    const planKey = planName.toUpperCase();
    const plan = PLANS[planKey];

    if (!plan) {
      return res.status(404).json({ 
        message: 'Plan not found' 
      });
    }

    const planDetails = {
      id: plan.id,
      name: plan.name,
      baseAmount: plan.baseAmount,
      totalAmount: plan.totalAmount, // GST already included
      duration: plan.duration,
      features: plan.features
    };

    res.json(planDetails);
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch plan details', 
      error: error.message 
    });
  }
};

module.exports = {
  getPlans,
  getPlanDetails
};