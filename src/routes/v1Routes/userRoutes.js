import { Router } from "express";
import { createUser, deleteUser, getAllUsers, getUser, updateUser } from "../../controllers/userController.js";
import { createPassword, forgotPassword, login, logout, profile, refresh, resetPassword, signup, updatePassword } from "../../controllers/authController.js";
import protect from "../../middlewares/protectMiddleware.js";
import restrictTo from "../../middlewares/restrictMiddleware.js";

const router = Router();

router.route("/create-password").post(createPassword);
router.route("/generate-random-password").post(createPassword);

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/refresh").post(refresh);
router.route("/logout").post(logout);

router.route("/profile").get(protect, profile);

router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:id").patch(resetPassword);
router.route("/update-password").patch(protect, updatePassword);

router
  .route("/")
  .get(protect, restrictTo("SUPERADMIN"), getAllUsers)
  .post(protect, restrictTo("SUPERADMIN", "ADMIN"), createUser);

router
  .route("/:id")
  .get(protect, restrictTo("SUPERADMIN", "ADMIN"), getUser)
  .put(protect, restrictTo("SUPERADMIN", "ADMIN"), updateUser)
  .patch(protect, restrictTo("SUPERADMIN", "ADMIN"), updateUser)
  .delete(protect, restrictTo("SUPERADMIN", "ADMIN"), deleteUser);

export default router;