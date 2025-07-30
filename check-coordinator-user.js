const User = require('./models/User');
const sequelize = require('./config/database');

async function checkCoordinatorUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Find the coordinator user
    const coordinator = await User.findOne({
      where: { username: 'coordinator.role' }
    });

    if (coordinator) {
      console.log('Coordinator user found:');
      console.log('ID:', coordinator.id);
      console.log('Username:', coordinator.username);
      console.log('Email:', coordinator.email);
      console.log('First Name:', coordinator.firstName);
      console.log('Last Name:', coordinator.lastName);
    } else {
      console.log('Coordinator user not found');
    }

    // Check all users
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'email']
    });

    console.log('\nAll users:');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });

  } catch (error) {
    console.error('Error checking coordinator user:', error);
  } finally {
    await sequelize.close();
  }
}

checkCoordinatorUser(); 