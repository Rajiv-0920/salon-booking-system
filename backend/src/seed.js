/**
 * Comprehensive Booking System Test Script
 *
 * This script:
 * 1. Registers different types of users (admin, salon owner, staff, customers)
 * 2. Creates salons, services, categories, and staff
 * 3. Creates bookings
 * 4. Tests access control for all routes with different user roles
 *
 * Usage: node test-booking-system.js
 */

const BASE_URL = 'http://localhost:5000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Helper function for colored console output
const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) =>
    console.log(
      `\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.bold}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`,
    ),
  subsection: (msg) =>
    console.log(`\n${colors.magenta}--- ${msg} ---${colors.reset}`),
};

// Test data storage
const testData = {
  users: {},
  salons: {},
  categories: {},
  services: {},
  staff: {},
  bookings: {},
};

// HTTP request helper
async function request(method, endpoint, token = null, body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test functions
async function registerUser(role, username, email, password, salonId = null) {
  log.subsection(`Registering ${role}: ${username}`);

  const userData = {
    username,
    email,
    password,
    role,
  };

  if (salonId) {
    userData.salonId = salonId;
  }

  const result = await request('POST', '/auth/register', null, userData);

  if (result.status === 201) {
    log.success(`Registered ${role}: ${username}`);
    testData.users[role] = {
      ...userData,
      ...result.data.user,
      token: result.data.token,
    };
    return result.data;
  } else {
    log.error(`Failed to register ${role}: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function loginUser(email, password) {
  const result = await request('POST', '/auth/login', null, {
    email,
    password,
  });

  if (result.status === 200) {
    log.success(`Logged in: ${email}`);
    return result.data;
  } else {
    log.error(`Failed to login: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function createSalon(token, salonData) {
  log.subsection('Creating Salon');

  const result = await request('POST', '/salons', token, salonData);

  if (result.status === 201) {
    log.success(`Created salon: ${salonData.name}`);
    testData.salons[salonData.name] = result.data;
    return result.data;
  } else {
    log.error(`Failed to create salon: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function createCategory(token, categoryData) {
  const result = await request('POST', '/categories', token, categoryData);

  if (result.status === 201) {
    log.success(`Created category: ${categoryData.name}`);
    testData.categories[categoryData.name] = result.data;
    return result.data;
  } else {
    log.error(`Failed to create category: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function createService(token, serviceData) {
  const result = await request('POST', '/services', token, serviceData);

  if (result.status === 201) {
    log.success(`Created service: ${serviceData.name}`);
    testData.services[serviceData.name] = result.data;
    return result.data;
  } else {
    log.error(`Failed to create service: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function createStaff(token, staffData) {
  const result = await request('POST', '/staff', token, staffData);

  if (result.status === 201) {
    log.success(`Created staff: ${staffData.userId}`);
    testData.staff[staffData.userId] = result.data;
    return result.data;
  } else {
    log.error(`Failed to create staff: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function createBooking(token, bookingData) {
  const result = await request('POST', '/bookings', token, bookingData);

  if (result.status === 201) {
    log.success(`Created booking: ${result.data.id}`);
    return result.data;
  } else {
    log.error(`Failed to create booking: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function testAccessControl(
  endpoint,
  token,
  role,
  expectedStatus,
  description,
) {
  const result = await request('GET', endpoint, token);

  const statusMatch = result.status === expectedStatus;
  const statusText = statusMatch
    ? `${colors.green}${result.status}${colors.reset}`
    : `${colors.red}${result.status} (expected ${expectedStatus})${colors.reset}`;

  if (statusMatch) {
    log.success(
      `${role.padEnd(15)} → ${description.padEnd(40)} [${statusText}]`,
    );
  } else {
    log.error(`${role.padEnd(15)} → ${description.padEnd(40)} [${statusText}]`);
  }

  return statusMatch;
}

// Main test execution
async function runTests() {
  try {
    log.section('BOOKING SYSTEM - COMPREHENSIVE ACCESS CONTROL TEST');

    // Step 1: Register Users
    log.section('STEP 1: REGISTERING USERS');

    await registerUser('admin', 'admin_user', 'admin@test.com', 'admin123');
    await registerUser(
      'salon_owner',
      'owner_john',
      'john@salon.com',
      'owner123',
    );

    // Create salon first so we can assign staff and other owner to it
    log.section('STEP 2: CREATING INITIAL SALON');
    const salon1 = await createSalon(testData.users.salon_owner.token, {
      name: 'Glamour Salon',
      description: 'Premium beauty salon',
      address: '123 Beauty St',
      city: 'New York',
      phone: '555-0101',
      email: 'contact@glamour.com',
    });

    if (!salon1) {
      log.error('Failed to create initial salon. Exiting.');
      return;
    }

    // Now register staff and another owner for the salon
    log.subsection('Registering additional users for Glamour Salon');
    await registerUser(
      'staff',
      'staff_mike',
      'mike@glamour.com',
      'staff123',
      salon1.id,
    );
    await registerUser(
      'salon_owner',
      'owner_sarah',
      'sarah@glamour.com',
      'owner123',
      salon1.id,
    );
    await registerUser(
      'customer',
      'customer_alice',
      'alice@customer.com',
      'customer123',
    );
    await registerUser(
      'customer',
      'customer_bob',
      'bob@customer.com',
      'customer123',
    );

    // Step 3: Create Categories
    log.section('STEP 3: CREATING CATEGORIES');
    const hairCategory = await createCategory(testData.users.admin.token, {
      name: 'Hair Services',
      description: 'All hair-related services',
    });
    const beautyCategory = await createCategory(testData.users.admin.token, {
      name: 'Beauty Services',
      description: 'Beauty and skincare services',
    });

    // Step 4: Create Services
    log.section('STEP 4: CREATING SERVICES');
    const haircutService = await createService(
      testData.users.salon_owner.token,
      {
        salonId: salon1.id,
        categoryId: hairCategory.id,
        name: 'Haircut & Style',
        description: 'Professional haircut with styling',
        duration: 60,
        price: 50.0,
      },
    );

    const colorService = await createService(testData.users.salon_owner.token, {
      salonId: salon1.id,
      categoryId: hairCategory.id,
      name: 'Hair Color',
      description: 'Full hair coloring service',
      duration: 120,
      price: 120.0,
    });

    // Step 5: Create Staff Member
    log.section('STEP 5: CREATING STAFF MEMBERS');
    const staffMember = await createStaff(testData.users.salon_owner.token, {
      userId: testData.users.staff.id,
      salonId: salon1.id,
      position: 'Senior Stylist',
      specialization: 'Hair cutting and coloring',
      available: true,
    });

    // Step 6: Create Bookings
    log.section('STEP 6: CREATING BOOKINGS');
    const booking1 = await createBooking(testData.users.customer.token, {
      salonId: salon1.id,
      serviceId: haircutService.id,
      staffId: staffMember.id,
      bookingDate: '2024-03-20T10:00:00Z',
      notes: 'First booking - Alice',
    });

    const booking2 = await createBooking(testData.users['customer'].token, {
      salonId: salon1.id,
      serviceId: colorService.id,
      staffId: staffMember.id,
      bookingDate: '2024-03-21T14:00:00Z',
      notes: 'Second booking - Alice',
    });

    // Create booking for Bob
    const bobLogin = await loginUser('bob@customer.com', 'customer123');
    const booking3 = await createBooking(bobLogin.token, {
      salonId: salon1.id,
      serviceId: haircutService.id,
      staffId: staffMember.id,
      bookingDate: '2024-03-22T11:00:00Z',
      notes: 'Bob booking',
    });

    testData.bookings = { booking1, booking2, booking3 };

    // Step 7: Test Access Control
    log.section('STEP 7: TESTING ACCESS CONTROL');

    // Test 1: Get All Bookings
    log.subsection('GET /bookings - Who can see all bookings?');
    await testAccessControl(
      '/bookings',
      testData.users.admin.token,
      'ADMIN',
      200,
      'View all bookings',
    );
    await testAccessControl(
      '/bookings',
      testData.users.salon_owner.token,
      'SALON_OWNER',
      200,
      'View all bookings',
    );
    await testAccessControl(
      '/bookings',
      testData.users.staff.token,
      'STAFF',
      200,
      'View salon bookings',
    );
    await testAccessControl(
      '/bookings',
      testData.users.customer.token,
      'CUSTOMER',
      200,
      'View own bookings',
    );
    await testAccessControl(
      '/bookings',
      null,
      'NO AUTH',
      401,
      'Unauthorized access',
    );

    // Test 2: Get Specific Booking
    log.subsection(
      `GET /bookings/${booking1.id} - Who can see Alice's booking?`,
    );
    await testAccessControl(
      `/bookings/${booking1.id}`,
      testData.users.admin.token,
      'ADMIN',
      200,
      "View Alice's booking",
    );
    await testAccessControl(
      `/bookings/${booking1.id}`,
      testData.users.salon_owner.token,
      'SALON_OWNER',
      200,
      "View Alice's booking",
    );
    await testAccessControl(
      `/bookings/${booking1.id}`,
      testData.users.staff.token,
      'STAFF',
      200,
      "View Alice's booking",
    );
    await testAccessControl(
      `/bookings/${booking1.id}`,
      testData.users.customer.token,
      'CUSTOMER (Alice)',
      200,
      'View own booking',
    );
    await testAccessControl(
      `/bookings/${booking1.id}`,
      bobLogin.token,
      'CUSTOMER (Bob)',
      403,
      "Cannot view Alice's booking",
    );

    // Test 3: Get Bookings by Salon
    log.subsection(
      `GET /salons/${salon1.id}/bookings - Salon-specific bookings`,
    );
    await testAccessControl(
      `/salons/${salon1.id}/bookings`,
      testData.users.admin.token,
      'ADMIN',
      200,
      'View salon bookings',
    );
    await testAccessControl(
      `/salons/${salon1.id}/bookings`,
      testData.users.salon_owner.token,
      'SALON_OWNER',
      200,
      'View own salon bookings',
    );
    await testAccessControl(
      `/salons/${salon1.id}/bookings`,
      testData.users.staff.token,
      'STAFF',
      200,
      'View salon bookings',
    );
    await testAccessControl(
      `/salons/${salon1.id}/bookings`,
      testData.users.customer.token,
      'CUSTOMER',
      403,
      'Cannot view salon bookings',
    );

    // Test 4: Get User's Own Bookings
    log.subsection('GET /users/:userId/bookings - User-specific bookings');
    await testAccessControl(
      `/users/${testData.users.customer.id}/bookings`,
      testData.users.customer.token,
      'CUSTOMER (Alice)',
      200,
      'View own bookings',
    );
    await testAccessControl(
      `/users/${testData.users.customer.id}/bookings`,
      bobLogin.token,
      'CUSTOMER (Bob)',
      403,
      "Cannot view Alice's bookings",
    );
    await testAccessControl(
      `/users/${testData.users.customer.id}/bookings`,
      testData.users.admin.token,
      'ADMIN',
      200,
      "View Alice's bookings",
    );

    // Test 5: Get All Salons
    log.subsection('GET /salons - Who can view salons?');
    await testAccessControl(
      '/salons',
      testData.users.admin.token,
      'ADMIN',
      200,
      'View all salons',
    );
    await testAccessControl(
      '/salons',
      testData.users.salon_owner.token,
      'SALON_OWNER',
      200,
      'View all salons',
    );
    await testAccessControl(
      '/salons',
      testData.users.staff.token,
      'STAFF',
      200,
      'View all salons',
    );
    await testAccessControl(
      '/salons',
      testData.users.customer.token,
      'CUSTOMER',
      200,
      'View all salons',
    );
    await testAccessControl(
      '/salons',
      null,
      'NO AUTH',
      200,
      'Public access to salons',
    );

    // Test 6: Get Specific Salon
    log.subsection(`GET /salons/${salon1.id} - Specific salon details`);
    await testAccessControl(
      `/salons/${salon1.id}`,
      testData.users.admin.token,
      'ADMIN',
      200,
      'View salon details',
    );
    await testAccessControl(
      `/salons/${salon1.id}`,
      testData.users.customer.token,
      'CUSTOMER',
      200,
      'View salon details',
    );
    await testAccessControl(
      `/salons/${salon1.id}`,
      null,
      'NO AUTH',
      200,
      'Public salon details',
    );

    // Test 7: Get Services
    log.subsection('GET /services - Service access');
    await testAccessControl(
      '/services',
      testData.users.admin.token,
      'ADMIN',
      200,
      'View all services',
    );
    await testAccessControl(
      '/services',
      testData.users.customer.token,
      'CUSTOMER',
      200,
      'View all services',
    );
    await testAccessControl(
      '/services',
      null,
      'NO AUTH',
      200,
      'Public service list',
    );

    // Test 8: Get Staff
    log.subsection('GET /staff - Staff member access');
    await testAccessControl(
      '/staff',
      testData.users.admin.token,
      'ADMIN',
      200,
      'View all staff',
    );
    await testAccessControl(
      '/staff',
      testData.users.salon_owner.token,
      'SALON_OWNER',
      200,
      'View all staff',
    );
    await testAccessControl(
      '/staff',
      testData.users.customer.token,
      'CUSTOMER',
      200,
      'View all staff',
    );
    await testAccessControl(
      '/staff',
      null,
      'NO AUTH',
      200,
      'Public staff list',
    );

    // Test 9: Get Users (Admin only)
    log.subsection('GET /users - User management');
    await testAccessControl(
      '/users',
      testData.users.admin.token,
      'ADMIN',
      200,
      'View all users',
    );
    await testAccessControl(
      '/users',
      testData.users.salon_owner.token,
      'SALON_OWNER',
      403,
      'Cannot view all users',
    );
    await testAccessControl(
      '/users',
      testData.users.customer.token,
      'CUSTOMER',
      403,
      'Cannot view all users',
    );

    // Test 10: Update Booking Status
    log.subsection('PATCH /bookings/:id - Update booking status');
    log.info('Testing booking status updates...');

    const updateBooking = async (
      bookingId,
      token,
      role,
      status,
      expectedStatus,
    ) => {
      const result = await request('PATCH', `/bookings/${bookingId}`, token, {
        status,
      });
      const statusMatch = result.status === expectedStatus;
      if (statusMatch) {
        log.success(
          `${role.padEnd(15)} → Update to '${status}' [${result.status}]`,
        );
      } else {
        log.error(
          `${role.padEnd(15)} → Update to '${status}' [${result.status}] (expected ${expectedStatus})`,
        );
      }
      return statusMatch;
    };

    await updateBooking(
      booking1.id,
      testData.users.admin.token,
      'ADMIN',
      'confirmed',
      200,
    );
    await updateBooking(
      booking2.id,
      testData.users.salon_owner.token,
      'SALON_OWNER',
      'confirmed',
      200,
    );
    await updateBooking(
      booking3.id,
      testData.users.staff.token,
      'STAFF',
      'confirmed',
      200,
    );
    await updateBooking(
      booking1.id,
      testData.users.customer.token,
      'CUSTOMER',
      'cancelled',
      200,
    );
    await updateBooking(
      booking2.id,
      bobLogin.token,
      'CUSTOMER (Bob)',
      'cancelled',
      403,
    );

    // Summary
    log.section('TEST SUMMARY');
    log.info('All access control tests completed!');
    log.info(`Created ${Object.keys(testData.users).length} users`);
    log.info(`Created ${Object.keys(testData.salons).length} salon(s)`);
    log.info(`Created ${Object.keys(testData.categories).length} categories`);
    log.info(`Created ${Object.keys(testData.services).length} services`);
    log.info(`Created ${Object.keys(testData.bookings).length} bookings`);

    log.section('TEST DATA FOR MANUAL TESTING');
    console.log('\nUser Credentials:');
    console.log('================');
    console.log(
      `Admin:        email: admin@test.com        password: admin123`,
    );
    console.log(
      `Salon Owner:  email: john@salon.com        password: owner123`,
    );
    console.log(
      `Staff:        email: mike@glamour.com      password: staff123`,
    );
    console.log(
      `Customer 1:   email: alice@customer.com    password: customer123`,
    );
    console.log(
      `Customer 2:   email: bob@customer.com      password: customer123`,
    );

    console.log('\nImportant IDs:');
    console.log('==============');
    console.log(`Salon ID:     ${salon1.id}`);
    console.log(`Booking 1 ID: ${booking1.id} (Alice)`);
    console.log(`Booking 2 ID: ${booking2.id} (Alice)`);
    console.log(`Booking 3 ID: ${booking3.id} (Bob)`);
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
console.log('Starting comprehensive booking system tests...\n');
runTests()
  .then(() => {
    console.log('\n✅ All tests completed!\n');
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
