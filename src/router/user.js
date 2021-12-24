const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");

//Creating user
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();

    res.status(201).json({
      success: true,
      user,
      token,
    });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

//Login user
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.status(200).json({
      success: true,
      user,
      token,
    });
  } catch (e) {
    res.status(404).json({
      success: false,
      message: "Unable to login!",
    });
  }
});

//Authenticate user
router.get("/users/me", auth, (req, res) => {
  res.send(req.user);
});

//Update-user
router.patch("/users/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdate = ["name", "email", "password"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdate.includes(update);
  });
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User Not Found!",
      });
    }
    update.foreach((update) => (user[update] = req.body[update]));

    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      error: e,
    });
  }
});

//Logout user
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.json({
      success: true,
      user: req.user,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unable to Logout!",
    });
  }
});

//Deleting user
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

//Creating profile pic
const multerStorage = multer.memoryStorage();

const multerFiter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image"), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFiter,
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("photo"),
  async (req, res) => {
    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/user/${req.file.filename}`);

    req.user.photo = req.file.filename;

    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    // console.log(error);
    res.status(400).send({ error: error.message });
  }
);

//Deleting user profile
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

//Getting user profile pic
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.photo) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.json({
      success: true,
      data: user.photo,
    });
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
