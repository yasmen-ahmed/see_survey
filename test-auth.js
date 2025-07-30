require('dotenv').config();
const jwt = require('jsonwebtoken');

// Test JWT token creation and verification
const testPayload = {
  userId: 1,
  username: 'testuser',
  role: 'admin'
};

const secret = process.env.JWT_SECRET || 'your-secret-key';

console.log('Environment variables loaded');
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('Using secret:', secret);

// Create a token
const token = jwt.sign(testPayload, secret, { expiresIn: '24h' });
console.log('Created token:', token);

// Verify the token
try {
  const decoded = jwt.verify(token, secret);
  console.log('Token verified successfully:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}

// Test token extraction from Authorization header
const authHeader = `Bearer ${token}`;
const extractedToken = authHeader && authHeader.split(' ')[1];
console.log('Extracted token from header:', extractedToken);

// Verify extracted token
try {
  const decodedExtracted = jwt.verify(extractedToken, secret);
  console.log('Extracted token verified successfully:', decodedExtracted);
} catch (error) {
  console.error('Extracted token verification failed:', error.message);
} 