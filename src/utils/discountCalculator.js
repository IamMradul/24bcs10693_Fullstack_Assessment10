function calculateFinalAmount(ticketPrice, discountCode) {
  if (ticketPrice === undefined || ticketPrice === null || isNaN(ticketPrice) || ticketPrice < 0) {
    throw new Error('Ticket price must be a non-negative number');
  }

  let normalizedCode = discountCode;
  if (typeof normalizedCode === 'string') {
    normalizedCode = normalizedCode.trim().toUpperCase();
    if (normalizedCode === '') {
      normalizedCode = null;
    }
  } else {
    normalizedCode = null;
  }

  if (!normalizedCode) {
    return {
      finalAmount: ticketPrice,
      discountCode: null
    };
  }

  if (normalizedCode === 'CAMPUS50') {
    return {
      finalAmount: Math.round(ticketPrice * 0.5 * 100) / 100,
      discountCode: 'CAMPUS50'
    };
  }

  if (normalizedCode === 'EARLYBIRD') {
    const discounted = ticketPrice - 100;
    return {
      finalAmount: discounted < 0 ? 0 : discounted,
      discountCode: 'EARLYBIRD'
    };
  }

  const err = new Error('Invalid discount code');
  err.statusCode = 400;
  throw err;
}

module.exports = {
  calculateFinalAmount
};
