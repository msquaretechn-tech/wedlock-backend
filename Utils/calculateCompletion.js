function calculateCompletion(data) {
  let totalWeight = 100;
  let completedWeight = 0;

  const fieldsToCheck = {
    basic_and_lifestye: {
      fields: ['firstName', 'lastName', 'displayName', 'gender', 'age', 'about', 'religion', 'maritalStatus', 'postedBy'],
      weight: 20
    },
    family_details: {
      fields: ['fatherOccupation', 'motherOccupation', 'numberOfSiblings', 'livingWithFamily'],
      weight: 10
    },
    personal_background: {
      fields: ['height', 'weight', 'bodyType', 'language', 'smokingHabbit', 'drinkingHabbit', 'diet', 'complexion'],
      weight: 20
    },
    religious_background: {
      fields: ['religion', 'community', 'subCommunity', 'gothra', 'timeOfBirth', 'dateOfBirth', 'placeOfBirth', 'motherTongue'],
      weight: 15
    },
    location_background: {
      fields: ['currentLocation', 'cityOfResidence', 'nationality', 'citizenShip', 'residencyVisaStatus'],
      weight: 10
    },
    education_and_financial: {
      fields: ['qualification', 'education', 'workingStatus', 'income'],
      weight: 15
    },
    interest_and_hobbies: 10
  };

  for (let section in fieldsToCheck) {
    const sectionData = fieldsToCheck[section];

    if (typeof sectionData === 'number') {
      if (data[section] && data[section] !== "Not Specified") {
        completedWeight += sectionData;
      }
    } else {
      const { fields, weight } = sectionData;
      const populatedFields = fields.filter(field => data[section] && data[section][field] && data[section][field] !== "Not Specified");
      const completionRatio = populatedFields.length / fields.length;
      completedWeight += completionRatio * weight;
    }
  }
  return Math.min(Math.floor(completedWeight), totalWeight);
}

export default calculateCompletion;
