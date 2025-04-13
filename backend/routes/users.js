const express = require("express");
const { check } = require("express-validator");
const router = express.Router();

const fileUpload = require("../middleware/file-upload");

const { getAllUsers, signup, login } = require("../controllers/users");

router.get("/", getAllUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signup
);

router.post("/login", login);

module.exports = router;
