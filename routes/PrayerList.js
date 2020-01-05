const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();

// @route GET api/contacts
// @route Get All Contacts
// @access Private
router.get('/', async (req, res) => {

});

// @route GET api/contacts/id
// @route Get A particular contact
// @access Private
router.get('/:_id', async (req, res) => {

});

module.exports = router;
