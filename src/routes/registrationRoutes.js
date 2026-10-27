const express = require('express');
const router = express.Router();
const {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration
} = require('../controllers/registrationController');
const validateObjectId = require('../middlewares/validateObjectId');

router.route('/')
  .post(createRegistration)
  .get(getRegistrations);

router.route('/:id')
  .get(validateObjectId, getRegistrationById)
  .put(validateObjectId, updateRegistration)
  .delete(validateObjectId, deleteRegistration);

module.exports = router;
