import { Router } from "express";
import protect from "../../middlewares/protectMiddleware.js";
import restrictTo from "../../middlewares/restrictMiddleware.js";
import { createRole, deleteRole, getAllRoles, getRole, updateRole } from "../../controllers/roleController.js";

const router = Router();

router
  .route("/")
  .get(getAllRoles)
  .post(protect, restrictTo("SUPERADMIN"), createRole);

router
  .route("/:id")
  .get(protect, restrictTo("SUPERADMIN"), getRole)
  .patch(protect, restrictTo("SUPERADMIN"), updateRole)
  .delete(protect, restrictTo("SUPERADMIN"), deleteRole);

export default router;