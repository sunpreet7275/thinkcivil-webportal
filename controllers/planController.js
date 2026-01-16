const { PLANS, calculateTotal, calculateGST } = require('../config/plans');

const getPlans = async (req, res) => {
  try {
    const plans = Object.values(PLANS).map(plan => ({
      name: plan.name,
      baseAmount: plan.baseAmount,
      totalAmount: calculateTotal(plan.baseAmount),
      gst: calculateGST(plan.baseAmount),
      duration: plan.duration,
      features: plan.features
    }));

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plans', error: error.message });
  }
};

const getPlanDetails = async (req, res) => {
  try {
    const { planName } = req.params;
    const plan = PLANS[planName.toUpperCase()];

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const planDetails = {
      name: plan.name,
      baseAmount: plan.baseAmount,
      totalAmount: calculateTotal(plan.baseAmount),
      gst: calculateGST(plan.baseAmount),
      duration: plan.duration,
      features: plan.features
    };

    res.json(planDetails);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plan details', error: error.message });
  }
};

module.exports = {
  getPlans,
  getPlanDetails
};