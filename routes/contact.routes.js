import express from 'express';
import { createContact,getAllContacts } from '../Controllers/contact.controller.js';
import { isAdminAuthenticated } from '../Middlewares/Admin/isAdminAuthenticated.js';

const contactRouter = express.Router();

contactRouter.post('/contact', createContact);
contactRouter.get('/get-contact',isAdminAuthenticated, getAllContacts);

export default contactRouter;
