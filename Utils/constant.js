const Constants = {
    STATUS_CODE: {
      OK: 200,
      CREATED: 201,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      INTERNAL_SERVER_ERROR: 500,
    },
    
    ERROR_MESSAGES: {
      MISSING_REQUIRED_FIELD: 'Required field is missing',
      INVALID_INPUT: 'Invalid input provided',
      AUTH_FAILED: 'Authentication failed',
      RESOURCE_NOT_FOUND: 'Resource not found',
    },
    
    KSTRINGS: {
      QUESTION_TEXT_REQUIRED: 'Question text is required.',
      QUESTION_ADDED_SUCCESSFULLY: 'Question added successfully',
      FAILED_TO_ADD_QUESTION: 'Failed to add question',
    },
  };
  
  export default Constants;
  