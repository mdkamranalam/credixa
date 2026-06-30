import express from "express";
import { 
    createTicket, 
    getMyTickets, 
    getAdminTickets, 
    getTicketDetails, 
    sendMessage, 
    updateTicketStatus 
} from "../controllers/support.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Routes for both Student and Admin
router.get("/tickets/:id", getTicketDetails);
router.post("/tickets/:id/messages", sendMessage);

// Student only routes
router.post("/tickets", requireRole("STUDENT"), createTicket);
router.get("/tickets", requireRole("STUDENT"), getMyTickets);

// Admin only routes
router.get("/admin/tickets", requireRole("INSTITUTION_ADMIN"), getAdminTickets);
router.put("/tickets/:id/status", requireRole("INSTITUTION_ADMIN"), updateTicketStatus);

export default router;
