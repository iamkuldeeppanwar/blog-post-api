const cors = require("cors");
require("dotenv").config();
const express = require("express");
require("./mongodb/mongoose");
const userRouter = require("./router/user");
const blogRouter = require("./router/blog");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
app.use("/public/img/user", express.static(path.join("public", "img", "user")));
app.use("/public/img/blog", express.static(path.join("public", "img", "blog")));
app.use(cookieParser());
app.use(userRouter);
app.use(blogRouter);

app.listen(port, () => {
  console.log(`Server is on port ${port}`);
});
