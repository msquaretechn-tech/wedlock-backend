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

    res.status(201).json({ success: true, data: newContact });
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

//update contact from contact db
export const contactDetails = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { firstName, lastName, email, country, phoneNumber, message } = req.body;
  const contact = await Contact.findByPk(id);
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found' });
  }
  contact.firstName = firstName ?? contact.firstName;
  contact.lastName = lastName ?? contact.lastName;
  contact.email = email ?? contact.email;
  contact.country = country ?? contact.country;
  contact.phoneNumber = phoneNumber ?? contact.phoneNumber;
  contact.message = message ?? contact.message;
  await contact.save();
  res.status(200).json({ success: true, data: contact });
})
