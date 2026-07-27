import express from 'express';
import { contactDetails, createContact, getAllContacts } from '../Controllers/contact.controller.js';
import { isAdminAuthenticated } from '../Middlewares/Admin/isAdminAuthenticated.js';
import { isAuthenticated } from '../Middlewares/auth.js';

const contactRouter = express.Router();

contactRouter.post('/contact', createContact);
contactRouter.get('/get-contact', isAdminAuthenticated, getAllContacts);
contactRouter.patch('/contact/:id', isAuthenticated, contactDetails)


export default contactRouter;
