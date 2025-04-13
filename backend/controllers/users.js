const { validationResult } = require("express-validator");

const { BadRequestError, UnauthenticatedError } = require("../errors");
const User = require("../models/User");

const getAllUsers = async (req, res) => {
  const users = await User.find({}, "-password");
  res.status(200).json({ users });
};

const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError("Invalid inputs passed, please check your data.");
  }

  const { name, email, password } = req.body;

  const hasUser = await User.findOne({ email });
  if (hasUser) {
    throw new BadRequestError("Could not create user, email already exists.");
  }

  const createdUser = await User.create({
    name,
    email,
    password,
    image: req.file.path,
    places: [],
  });
  const token = createdUser.createJWT();

  res.status(201).json({ user: createdUser, token });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password.");
  }

  const identifiedUser = await User.findOne({ email });

  if (!identifiedUser) {
    throw new UnauthenticatedError("Invalid credentials.");
  }

  const isMatch = await identifiedUser.comparePassword(password);
  if (!isMatch) {
    throw new UnauthenticatedError("Incorrect password.");
  }

  const token = identifiedUser.createJWT();

  res.json({ user: identifiedUser, token });
};

module.exports = { getAllUsers, signup, login };
