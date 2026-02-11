# API Gateway Testing Commands

## Your API Gateway URL
https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod

## Test Commands

### 1. Basic Health Check (Root endpoint)
```bash
curl -X GET "https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/"
```

### 2. Test FastAPI docs endpoint
```bash
curl -X GET "https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/docs"
```

### 3. Test visitor stats endpoint (requires authentication)
```bash
curl -X GET "https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/api/visitors/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test visitor check-in (public endpoint)
```bash
curl -X POST "https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/api/visitors/check-in" \
  -H "Content-Type: application/json" \
  -d '{
    "visitor_name": "Test Visitor",
    "mobile_number": "1234567890",
    "email_address": "test@example.com",
    "company": "Test Company",
    "person_to_meet": "admin",
    "reason_to_visit": "Testing API",
    "warehouse": "Main"
  }'
```

### 5. Test Google Form submission endpoint
```bash
curl -X POST "https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/api/visitors/google-form" \
  -H "Content-Type: application/json" \
  -d '{
    "visitor_name": "Test Appointment",
    "mobile": "9876543210",
    "email": "appointment@example.com",
    "company": "Test Corp",
    "host_name": "admin",
    "purpose": "Business Meeting",
    "preferred_time_slot": "10:00 AM - 11:00 AM",
    "carrying_items": "Laptop",
    "additional_remarks": "API Gateway test",
    "source": "test",
    "submitted_at": "2026-01-12T06:45:00Z"
  }'
```

### 6. Test CORS (from browser console)
```javascript
fetch('https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```