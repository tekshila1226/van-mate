describe('Admin API Authentication Tests', () => {
  const admin = {
    firstName: 'Test',
    lastName: 'Admin',
    email: `admin${Date.now()}@test.com`,
    password: 'password123',
    phone: '1234567890',
    schoolName: 'Test School',
    department: 'transportation',
    role: 'admin'
  };

  let authToken;

  it('should register a new admin account via API', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users/register',
      body: admin,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.user).to.have.property('id');
      expect(response.body.token).to.be.a('string');
    });
  });

  it('should not allow registering with existing email', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users/register',
      body: admin,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Email already registered');
    });
  });

  it('should login with admin credentials', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users/login',
      body: {
        email: admin.email,
        password: admin.password
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.user.role).to.eq('admin');
      expect(response.body.token).to.be.a('string');
      
      // Save token for subsequent requests
      authToken = response.body.token;
    });
  });

  it('should reject login with invalid credentials', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users/login',
      body: {
        email: admin.email,
        password: 'wrongpassword'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Invalid credentials');
    });
  });

  it('should access protected admin routes with token', function() {
    // Skip if previous test failed to get token
    if (!authToken) this.skip();
    
    cy.request({
      method: 'GET',
      url: 'http://localhost:5000/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('users');
    });
  });
});