// config/plans.js
const PLANS = {
  PRE: {
    id: 'pre',
    name: 'PRELIMS Mentorship with Test Series (2026)',
    baseAmount: 5999,
    totalAmount: 5999, // GST included
    duration: '',
    features: [
      'Complete Prelims syllabus coverage',
      '50+ Mock Tests with detailed analysis',
      'Daily current affairs updates',
      'Personal mentorship',
      'Doubt clearing sessions',
      'Study material PDFs'
    ]
  },
  MAINS: {
    id: 'mains',
    name: 'MAINS Mentorship',
    baseAmount: 14999,
    totalAmount: 14999, // GST included
    duration: '',
    features: [
      'Complete Mains syllabus coverage',
      'Answer writing practice',
      '30+ Mock Tests',
      'One-on-one mentorship',
      'Essay guidance',
      'Optional subject support'
    ]
  },
  COMBO: {
    id: 'combo',
    name: 'COMBO Mentorship (Prelims + Mains)',
    baseAmount: 19999,
    totalAmount: 19999, // GST included
    duration: '',
    features: [
      'Complete Prelims + Mains coverage',
      'All test series included',
      'Comprehensive mentorship',
      'Priority doubt resolution',
      'Interview guidance',
      'Save ₹4,999'
    ]
  }
};

// Since GST is included, totalAmount is same as baseAmount
const calculateTotal = (baseAmount) => baseAmount;

const getPlanDetails = (planId) => {
  return PLANS[planId.toUpperCase()] || null;
};

module.exports = {
  PLANS,
  calculateTotal,
  getPlanDetails
};