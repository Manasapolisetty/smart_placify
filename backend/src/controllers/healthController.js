import { pool } from '../config/database.js';

export const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'SmartPlacify API is running',
  });
};

export const getDbHealth = async (req, res, next) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return res.status(200).json({
        success: true,
        message: 'Database connection successful',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      errors: ['Unable to establish database connection.'],
    });
  }
};
