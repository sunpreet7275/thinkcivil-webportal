module.exports = {
  PLANS: {
    PRE: {
      name: 'pre',
      baseAmount: 2999,
      duration: '365 days',
      features: [
        'Prelims Test Series',
        'Current Affairs',
        'Study Materials',
        'Performance Analytics'
      ]
    },
    MAINS: {
      name: 'mains',
      baseAmount: 4999,
      duration: '365 days',
      features: [
        'Mains Test Series',
        'Answer Writing Practice',
        'Essay Writing',
        'Optional Subject Tests',
        'Expert Evaluation'
      ]
    },
    COMBO: {
      name: 'combo',
      baseAmount: 6999,
      duration: '365 days',
      features: [
        'Prelims + Mains Tests',
        'Answer Writing Practice',
        'Video Lectures',
        'Doubt Solving Sessions',
        'Personal Mentorship',
        'All Study Materials'
      ]
    }
  },
  
  calculateTotal: (baseAmount) => {
    const gst = baseAmount * 0.18;
    return baseAmount + gst;
  },
  
  calculateGST: (baseAmount) => {
    return baseAmount * 0.18;
  }
};