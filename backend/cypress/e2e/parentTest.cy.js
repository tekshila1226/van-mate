describe('Parent API Authentication Tests', () => {
  const parent = {
    firstName: 'Test',
    lastName: 'Parent',
    email: `parent${Date.now()}@test.com`,
    password: 'password123',
    phone: '9876543210',
    address: '123 Main St, City, State 12345',
    role: 'parent'
  };

  let authToken;

  it('should register a new parent account via API', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users/register',
      body: parent,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.user).to.have.property('id');
      expect(response.body.token).to.be.a('string');
    });
  });

  it('should not allow registering without required fields', () => {
    const incompleteParent = { ...parent };
    delete incompleteParent.address;
    incompleteParent.email = `incomplete${Date.now()}@test.com`;

    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users/register',
      body: incompleteParent,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
    });
  });

  it('should login with parent credentials', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users/login',
      body: {
        email: parent.email,
        password: parent.password
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.user.role).to.eq('parent');
      expect(response.body.token).to.be.a('string');
      
      // Save token for subsequent requests
      authToken = response.body.token;
    });
  });

  it('should access parent profile with token', function() {
    // Skip if previous test failed to get token
    if (!authToken) this.skip();
    
    cy.request({
      method: 'GET',
      url: 'http://localhost:5000/api/users/profile',
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.user.email).to.eq(parent.email);
    });
  });

  it('should not allow registering with existing email', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users/register',
      body: parent,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Email already registered');
    });
  });
});