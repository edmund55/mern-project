const fs = require("fs");
const uuid = require("uuid");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const {
  NotFoundError,
  BadRequestError,
  CustomError,
  UnauthenticatedError,
} = require("../errors");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/Place");
const User = require("../models/User");

const getPlaceById = async (req, res) => {
  const { pid } = req.params;
  const targetPlace = await Place.findById(pid);
  if (!targetPlace) {
    throw new NotFoundError(
      `Could not find a place for the provided id ${pid}`
    );
  }

  res.status(200).json({ place: targetPlace });
};

const getPlacesByUserId = async (req, res, next) => {
  const { uid } = req.params;
  const places = await Place.find({ creator: uid });
  if (!places.length) {
    return next(
      new NotFoundError(
        `Could not find a place for the provided user id ${uid}`
      )
    );
  }
  res.status(200).json({ places, count: places.length });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new BadRequestError("Invalid inputs passed, please check your data.")
    );
  }

  const { title, description, address } = req.body;
  const { userId } = req.userData;
  // default coordinates for all places:
  const location = {
    lat: 40.7484474,
    lng: -73.9871516,
  };

  // **Google geocoding api require a biling account**
  //const coordintes = await getCoordsForAddress(address);

  const createdPlace = new Place({
    title,
    description,
    address,
    location,
    image: req.file.path,
    creator: userId,
  });

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(`Could not find user with id ${userId}.`);
    }
  } catch (error) {
    return next(new CustomError("Create place failed."));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save();
    await sess.commitTransaction();
  } catch (error) {
    return next(new CustomError("Create place failed. (2)"));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError("Invalid inputs passed, please check your data.");
  }
  const { pid } = req.params;
  const { title, description } = req.body;
  const { userId } = req.userData;

  if (!title || !description) {
    throw new BadRequestError("Please provide title and description.");
  }

  const updatedPlace = await Place.findOneAndUpdate(
    { _id: pid, creator: userId },
    { title, description },
    { new: true }
  );

  if (!updatedPlace) {
    throw new NotFoundError(`Could not find place with id ${pid}`);
  }

  return res.status(200).json({ place: updatedPlace });
};

const deletePlace = async (req, res, next) => {
  const { pid } = req.params;
  const { userId } = req.userData;

  let deletedPlace;
  try {
    deletedPlace = await Place.findById(pid).populate("creator");

    if (!deletedPlace) {
      throw new NotFoundError(
        `Could not find a place for the provided id ${pid}`
      );
    }
  } catch (error) {
    return next(new CustomError("Delete place failed."));
  }

  if (deletedPlace.creator._id.toString() !== userId) {
    throw new UnauthenticatedError("You are not allowed to delete this place.");
  }

  const imagePath = deletedPlace.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await Place.findByIdAndDelete(pid, { session: sess });
    deletedPlace.creator.places.pull(deletedPlace);
    await deletedPlace.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(new CustomError("Delete place failed. (2)"));
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  return res.status(200).json({ place: deletedPlace });
};

module.exports = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};
