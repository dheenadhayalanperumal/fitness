import mongoose from "mongoose"

export interface DbError {
  code: string
  message: string
  status: number
  field?: string
}

export function handleMongoDbError(error: any): DbError {
  console.error("MongoDB Error:", JSON.stringify(error, null, 2))

  // Duplicate key error
  if (error.code === 11000 || error.code === 11001) {
    // Extract the field and value from the error message if keyPattern/keyValue is not available
    let field = "unknown"
    let value = "unknown"
    
    if (error.keyPattern && error.keyValue) {
      field = Object.keys(error.keyPattern)[0]
      value = error.keyValue[field]
    } else if (error.message) {
      // Try to extract from error message using regex
      const matches = error.message.match(/index:\s+(?:.*\$)?([^\s_]+)_/i)
      if (matches && matches[1]) {
        field = matches[1]
      }
      
      const valueMatches = error.message.match(/{\s*:\s*"([^"]*)"/)
      if (valueMatches && valueMatches[1]) {
        value = valueMatches[1]
      }
    }

    return {
      code: "DUPLICATE_KEY",
      message: `The ${field} "${value}" is already in use.`,
      status: 409, // Conflict
      field,
    }
  }

  // Validation error
  if (error instanceof mongoose.Error.ValidationError) {
    const field = Object.keys(error.errors)[0]
    return {
      code: "VALIDATION_ERROR",
      message: error.errors[field].message,
      status: 400, // Bad Request
      field,
    }
  }

  // Connection error
  if (error instanceof mongoose.Error.MongooseServerSelectionError) {
    return {
      code: "CONNECTION_ERROR",
      message: "Unable to connect to the database. Please try again later.",
      status: 503, // Service Unavailable
    }
  }

  // Cast error (invalid ID format)
  if (error instanceof mongoose.Error.CastError) {
    return {
      code: "INVALID_ID",
      message: `Invalid ${error.path}: ${error.value}`,
      status: 400, // Bad Request
      field: error.path,
    }
  }

  // Default error
  return {
    code: "DATABASE_ERROR",
    message: error.message || "An unexpected database error occurred.",
    status: 500, // Internal Server Error
  }
}
