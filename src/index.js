require("dotenv").config();
const cors = require("cors");
const express = require("express");
require("./mongodb/mongoose");
const userRouter = require("./router/user");
const blogRouter = require("./router/blog");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

app.use(cors());
app.use("/public/img/user", express.static(path.join("public", "img", "user")));
app.use("/public/img/blog", express.static(path.join("public", "img", "blog")));
const port = process.env.PORT || 4000;

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(userRouter);
app.use(blogRouter);

app.listen(port, () => {
  console.log(`Server is on port ${port}`);
});
