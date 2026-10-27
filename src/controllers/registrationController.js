const Registration = require('../models/Registration');
const { calculateFinalAmount } = require('../utils/discountCalculator');

const createRegistration = async (req, res, next) => {
  try {
    const {
      studentName,
      collegeEmail,
      rollNumber,
      eventType,
      teamSize,
      ticketPrice,
      discountCode,
      status,
      registrationDate
    } = req.body;

    let calculatedFinalAmount;
    let normalizedDiscountCode = discountCode;

    if (ticketPrice !== undefined && ticketPrice !== null) {
      try {
        const discountResult = calculateFinalAmount(ticketPrice, discountCode);
        calculatedFinalAmount = discountResult.finalAmount;
        normalizedDiscountCode = discountResult.discountCode;
      } catch (discountErr) {
        return res.status(400).json({
          success: false,
          message: discountErr.message,
          errors: [discountErr.message]
        });
      }
    }

    if (eventType === 'AI_WORKSHOP' && teamSize !== undefined && teamSize > 1) {
      return res.status(400).json({
        success: false,
        message: 'AI Workshop only permits individual registrations',
        errors: ['AI Workshop only permits individual registrations']
      });
    }

    const registration = new Registration({
      studentName,
      collegeEmail,
      rollNumber,
      eventType,
      teamSize,
      ticketPrice,
      discountCode: normalizedDiscountCode,
      finalAmount: calculatedFinalAmount,
      status: status || 'PENDING',
      registrationDate: registrationDate || undefined
    });

    const savedRegistration = await registration.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: savedRegistration
    });
  } catch (err) {
    return next(err);
  }
};

const getRegistrations = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.eventType) {
      filter.eventType = req.query.eventType;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const registrations = await Registration.find(filter).sort({ registrationDate: -1 });

    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (err) {
    return next(err);
  }
};

const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: registration
    });
  } catch (err) {
    return next(err);
  }
};

const updateRegistration = async (req, res, next) => {
  try {
    const existing = await Registration.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const updateData = { ...req.body };

    const effectiveEventType =
      updateData.eventType !== undefined ? updateData.eventType : existing.eventType;
    const effectiveTeamSize =
      updateData.teamSize !== undefined ? updateData.teamSize : existing.teamSize;

    if (effectiveEventType === 'AI_WORKSHOP' && effectiveTeamSize > 1) {
      return res.status(400).json({
        success: false,
        message: 'AI Workshop only permits individual registrations',
        errors: ['AI Workshop only permits individual registrations']
      });
    }

    if (updateData.ticketPrice !== undefined || updateData.discountCode !== undefined) {
      const effectiveTicketPrice =
        updateData.ticketPrice !== undefined ? updateData.ticketPrice : existing.ticketPrice;
      const effectiveDiscountCode =
        updateData.discountCode !== undefined ? updateData.discountCode : existing.discountCode;

      try {
        const discountResult = calculateFinalAmount(effectiveTicketPrice, effectiveDiscountCode);
        updateData.finalAmount = discountResult.finalAmount;
        updateData.discountCode = discountResult.discountCode;
      } catch (discountErr) {
        return res.status(400).json({
          success: false,
          message: discountErr.message,
          errors: [discountErr.message]
        });
      }
    }

    const updated = await Registration.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
      context: 'query'
    });

    return res.status(200).json({
      success: true,
      message: 'Registration updated successfully',
      data: updated
    });
  } catch (err) {
    return next(err);
  }
};

const deleteRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration
};
