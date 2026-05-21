import Contact from "../Models/contact.model.js";

export const createContact = async (req, res) => {
  try {
    const { firstName, lastName, email, country, phoneNumber, message } = req.body;

    const newContact = await Contact.create({
      firstName,
      lastName,
      email,
      country,
      phoneNumber,
      message
    });

    res.status(201).json({ success: true, data: newContact }) ;
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, data: contacts });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
