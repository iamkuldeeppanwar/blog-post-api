const express = require("express");
const router = new express.Router();
const Blog = require("../model/blog");
const User = require("../model/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");



//Get All Blogs
router.get("/allblogs", async (req, res) => {
  let a = 1;

  try {
    const blog = await Blog.find();

    if (!blog) {
      throw new Error("Blog not found!");
    }
    res.json(blog);
  } catch (e) {
    res.status(404).json(e);
  }
});

//Creating Blogs
router.post("/blogs", auth, async (req, res) => {
  const blog = new Blog({
    ...req.body,
    owner: req.user._id,
    user: req.user._id,
    name: req.user.name,
    photo: req.user.photo,
  });

  try {
    await blog.save();
    res.status(201).send(blog);
  } catch (e) {
    res.status(400).send(e);
  }
});

//Get Single Blog
router.get("/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById({ _id: req.params.id });

    if (!blog) {
      throw new Error("Blog not Found!");
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (e) {
    res.status(404).json({
      success: false,
      e,
    });
  }
});

//Comments on blog
router.patch("/blogs/comment", auth, async (req, res) => {
  const { comment, blogId } = req.body;

  const reviews = {
    user: req.user._id,
    name: req.user.name,
    photo: req.user.photo,
    comment,
  };
  await Blog.findByIdAndUpdate(
    blogId,
    {
      $push: { review: reviews },
    },
    {
      new: true,
    }
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({ error: err });
    } else {
      res.json(result);
    }
  });
});

//Updating Blog
router.patch("/blogs/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["title", "description"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "invalid updates" });
  }

  try {
    const blog = await Blog.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    blog.title = req.body.title;
    blog.description = req.body.description;

    await blog.save();

    if (!blog) {
      return res.status(404).send();
    }

    updates.forEach((update) => (blog[update] = req.body[update]));
    res.send(blog);
  } catch (e) {
    res.status(400).send(e);
  }
});

//Deleting Blog
router.delete("/blogs/:id", auth, async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!blog) {
      return res.status(404).send();
    }

    res.send(blog);
  } catch (e) {
    res.status(500).send(e);
  }
});

//creating User Blog pic
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

router.patch(
  "/blogs/me/avatar/:id",
  auth,
  upload.single("image"),
  async (req, res) => {
    req.file.filename = `blog-${req.user._id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/blog/${req.file.filename}`);

    req.file.image = req.file.filename;

    const blog = await Blog.findByIdAndUpdate(req.params.id, req.file);
    console.log(blog);

    await blog.save();
    res.send(blog);
  },
  (error, req, res, next) => {
    console.log(error);
    res.status(400).send({ error: error.message });
  }
);

//Deleting user Blog pic
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

//Getting user Blog pic
router.get("/blogs/:id/avatar", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog || !blog.image) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.json({
      success: true,
      data: blog.image,
    });
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
