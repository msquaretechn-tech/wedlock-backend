import User from './user.js';
import Answer from './answer.model.js';
import otherDetails from './otherDetails.model.js';
import locationDetails from './locationDetails.model.js';
import imageUpload from './imageUpload.model.js';
import qualificationDetails from './qualificationDetails.model.js';
import personalDetails from './personalDetails.model.js';
import FavProfile from './favProfile.model.js';
import happyStories from './happyStories.model.js';
import Connection from './connection.model.js';
import Plan from './plan.model.js';
import Subscription from './subscription.model.js';
import dropdown from './dropdown.model.js';
import Notification from './notification.model.js';
import dropDownType from './dropdowntype.model.js';
import ToggleSection from './toggleSection.model.js';
import Recommendation from './recommendation.model.js';
import SuspendedUser from './Admin/suspended.user.js';

User.hasMany(Answer, { foreignKey: 'userId', as: 'answers' });
Answer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(personalDetails, { foreignKey: 'userId', as: 'personalDetails' });
personalDetails.belongsTo(User, { foreignKey: 'userId', as: 'user' });


User.hasMany(otherDetails, { foreignKey: 'userId', as: 'otherDetails' }); 
otherDetails.belongsTo(User, { foreignKey: 'userId', as: 'user' });


User.hasMany(locationDetails, { foreignKey: 'userId', as: 'locationDetails' });
locationDetails.belongsTo(User, { foreignKey: 'userId', as: 'user' });  

User.hasMany(imageUpload, { foreignKey: 'userId', as: 'imageUpload' });
imageUpload.belongsTo(User, { foreignKey: 'userId', as: 'user' });


User.hasMany(qualificationDetails, { foreignKey: 'userId', as: 'qualificationDetails' });
qualificationDetails.belongsTo(User, { foreignKey: 'userId', as: 'user' });


User.hasMany(FavProfile, { foreignKey: 'favoritingUserId', as: 'FavoritingProfiles' });
FavProfile.belongsTo(User, { foreignKey: 'favoritingUserId', as: 'FavoritingUser' });

User.hasMany(FavProfile, { foreignKey: 'favoritedUserId', as: 'FavoritedProfiles' });
FavProfile.belongsTo(User, { foreignKey: 'favoritedUserId', as: 'FavoritedUser' });


User.hasMany(happyStories, { foreignKey: 'userId', as: 'happyStories' });
happyStories.belongsTo(User, { foreignKey: 'userId', as: 'user' });


// A user can send many connection requests (senderId refers to the sender)
User.hasMany(Connection, { foreignKey: 'senderId', as: 'SentConnections' });

// A user can receive many connection requests (receiverId refers to the receiver)
User.hasMany(Connection, { foreignKey: 'receiverId', as: 'ReceivedConnections' });

// Connection belongs to the user who sent the request (senderId)
Connection.belongsTo(User, { foreignKey: 'senderId', as: 'Sender' });

// Connection belongs to the user who received the request (receiverId)
Connection.belongsTo(User, { foreignKey: 'receiverId', as: 'Receiver' });



User.belongsTo(Plan, { foreignKey: 'planId', as: 'plans' }); 

Plan.hasMany(User, { foreignKey: 'planId', as: 'users' }); 

Subscription.belongsTo(User, { foreignKey: 'userId', as: 'users' });
Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plans' });

dropdown.belongsTo(dropDownType, { foreignKey: 'dropDownTypeId', as: 'dropDownType' });
dropDownType.hasMany(dropdown, { foreignKey: 'dropDownTypeId', as: 'dropdowns' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });


User.hasMany(ToggleSection, { foreignKey: 'userId', as: 'toggleSections' });
ToggleSection.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Add these associations for Subscription
User.hasMany(Subscription, { 
    foreignKey: 'userId', 
    as: 'subscriptions' 
  });
  
  Subscription.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  Plan.hasMany(Subscription, { 
    foreignKey: 'planId', 
    as: 'subscriptions' 
  });
  // Add these associations for Recommendation
User.hasMany(Recommendation, {
    foreignKey: 'userId',
    as: 'recommendations'
  });
  
  Recommendation.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  Subscription.belongsTo(Plan, { 
    foreignKey: 'planId', 
    as: 'plan' 
  });

  SuspendedUser.belongsTo(User, { foreignKey: 'userId' });
  SuspendedUser.belongsTo(personalDetails, { foreignKey: 'userId', targetKey: 'userId' });

  
  User.hasOne(personalDetails, { foreignKey: 'userId' });
  personalDetails.belongsTo(User, { foreignKey: 'userId' });
  
  SuspendedUser.belongsTo(imageUpload, { foreignKey: 'userId' });




export { User, Answer, personalDetails,SuspendedUser, Recommendation, otherDetails, locationDetails, imageUpload, qualificationDetails,FavProfile,happyStories,Connection,Plan,Subscription,dropdown,dropDownType,Notification ,ToggleSection};
