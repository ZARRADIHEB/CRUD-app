const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");

//? image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("image");

//? Insert an user into database route
router.post("/add", upload, async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    image: req.file.filename,
  });
  try {
    await user.save();
    console.log("User added successfully!");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  } finally {
    req.session.message = {
      type: "success",
      message: "User added successfully",
    };
    res.redirect("/");
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.render("index", {
      title: "Home Page",
      users: users, // Pass the fresh user data
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add Users" });
});

router.get("/edit/:id", async (req, res) => {
  let id = req.params.id;
  const user = await User.findById(id);
  try {
    if (user == null) {
      res.redirect("/");
    }
    res.render("edit_users", { title: "Edit User", user });
  } catch (err) {
    res.redirect("/");
  }
});

router.post("/update/:id", upload, async (req, res) => {
  const id = req.params.id;
  let new_image = "";

  // Handle image update
  if (req.file) {
    new_image = req.file.filename;
    try {
      // Delete the old image if a new one is uploaded
      fs.unlinkSync("./uploads/" + req.body.old_image);
    } catch (err) {
      console.log("Error deleting old image:", err);
    }
  } else {
    new_image = req.body.old_image; // Retain the old image if no new one is uploaded
  }

  try {
    // Update user in the database
    await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    });

    // Success message
    req.session.message = {
      type: "success",
      message: "User updated successfully!",
    };
    res.redirect("/");
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: error.message, type: "danger" });
  }
});

router.get("/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // Find and delete the user
    const result = await User.findByIdAndDelete(id);

    if (!result) {
      // If no user is found, redirect with an error message
      req.session.message = {
        type: "danger",
        message: "User not found!",
      };
      return res.redirect("/");
    }

    // Delete associated image if it exists
    if (result.image) {
      try {
        fs.unlinkSync("./uploads/" + result.image);
      } catch (err) {
        console.log("Error deleting image file:", err);
      }
    }

    // Success message
    req.session.message = {
      type: "success",
      message: "User deleted successfully",
    };
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
