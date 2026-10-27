const mongoose = require('mongoose');
const { calculateFinalAmount } = require('../utils/discountCalculator');

const collegeEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac\.in)$/i;
const rollNumberRegex = /^[A-Za-z0-9]{8,10}$/;

const registrationSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [3, 'Student name must be at least 3 characters long'],
      maxlength: [50, 'Student name cannot exceed 50 characters']
    },
    collegeEmail: {
      type: String,
      required: [true, 'College email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [collegeEmailRegex, 'Must be a valid college email ending in .edu or .ac.in']
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      uppercase: true,
      match: [rollNumberRegex, 'Roll number must be alphanumeric and between 8 to 10 characters']
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['CODING_HACKATHON', 'AI_WORKSHOP', 'ROBOTICS', 'GAMING'],
        message: '{VALUE} is not a valid event type'
      }
    },
    teamSize: {
      type: Number,
      required: [true, 'Team size is required'],
      min: [1, 'Team size must be at least 1'],
      max: [4, 'Team size cannot exceed 4'],
      validate: {
        validator: Number.isInteger,
        message: 'Team size must be an integer'
      }
    },
    ticketPrice: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Ticket price cannot be negative']
    },
    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return ['CAMPUS50', 'EARLYBIRD'].includes(v);
        },
        message: 'Invalid discount code'
      }
    },
    finalAmount: {
      type: Number,
      required: [true, 'Final amount is required'],
      min: [0, 'Final amount cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'CONFIRMED', 'CANCELLED'],
        message: '{VALUE} is not a valid status'
      },
      default: 'PENDING'
    },
    registrationDate: {
      type: Date,
      default: Date.now,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return v.getTime() <= Date.now() + 1000;
        },
        message: 'Registration date cannot be a future date'
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      }
    }
  }
);

registrationSchema.path('teamSize').validate({
  validator: async function (value) {
    if (value === undefined || value === null) return true;

    let currentEvent = this ? this.eventType : undefined;

    if (!currentEvent && this && typeof this.getUpdate === 'function') {
      const update = this.getUpdate();
      currentEvent = update.eventType || (update.$set && update.$set.eventType);

      if (!currentEvent && this.model) {
        const doc = await this.model.findOne(this.getQuery());
        if (doc) currentEvent = doc.eventType;
      }
    }

    if (currentEvent === 'AI_WORKSHOP' && value > 1) {
      return false;
    }
    return true;
  },
  message: 'AI Workshop only permits individual registrations'
});

registrationSchema.path('eventType').validate({
  validator: async function (value) {
    if (value !== 'AI_WORKSHOP') return true;

    let size = this ? this.teamSize : undefined;

    if (size === undefined && this && typeof this.getUpdate === 'function') {
      const update = this.getUpdate();
      size = update.teamSize !== undefined ? update.teamSize : (update.$set && update.$set.teamSize);

      if (size === undefined && this.model) {
        const doc = await this.model.findOne(this.getQuery());
        if (doc) size = doc.teamSize;
      }
    }

    if (size !== undefined && size > 1) {
      return false;
    }
    return true;
  },
  message: 'AI Workshop only permits individual registrations'
});

registrationSchema.pre('validate', function (next) {
  if (this.ticketPrice !== undefined && this.ticketPrice !== null) {
    try {
      const result = calculateFinalAmount(this.ticketPrice, this.discountCode);
      this.finalAmount = result.finalAmount;
      if (result.discountCode) {
        this.discountCode = result.discountCode;
      }
    } catch (err) {
      return next(err);
    }
  }

  if (this.eventType === 'AI_WORKSHOP' && this.teamSize > 1) {
    this.invalidate('teamSize', 'AI Workshop only permits individual registrations');
  }

  next();
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
