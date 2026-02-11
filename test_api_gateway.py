import requests

def test_api_gateway():
    base_url = 'https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod'
    
    print('🔍 Testing API Gateway after fix...')
    print(f'Base URL: {base_url}')
    print('=' * 50)
    
    # Test endpoints
    tests = [
        ('/', 'Root endpoint'),
        ('/docs', 'FastAPI Documentation'), 
        ('/openapi.json', 'OpenAPI spec'),
        ('/api/visitors/phone/1234567890', 'Public visitor lookup'),
    ]
    
    for path, name in tests:
        url = f'{base_url}{path}'
        try:
            response = requests.get(url, timeout=10)
            status = response.status_code
            
            if status == 404 and response.json().get('detail') == 'Not Found':
                print(f'❌ {name}: Still getting API Gateway 404')
            elif status in [200, 401, 403, 422]:  # Any non-404 response means Lambda is working
                print(f'✅ {name}: Lambda is responding! (Status: {status})')
            else:
                print(f'⚠️  {name}: Unexpected status {status}')
                
        except Exception as e:
            print(f'❌ {name}: Error - {e}')
    
    print('=' * 50)
    print('If you see ❌ API Gateway 404s, follow the fix guide!')
    print('If you see ✅ Lambda responses, your API is working!')

if __name__ == '__main__':
    test_api_gateway()