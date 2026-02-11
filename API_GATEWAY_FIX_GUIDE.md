# API Gateway Troubleshooting Guide

## Problem: All endpoints return 404 "Not Found"

Your Lambda function is working, but API Gateway can't reach it. Here are the most common fixes:

## 🔍 Step 1: Check API Gateway Integration

1. **Go to AWS Console → API Gateway**
2. **Find your API** (should be named something like `visitor-management-api`)
3. **Go to Resources section**
4. **Check for {proxy+} resource:**
   - Should have a resource called `{proxy+}` 
   - This resource should have `ANY` method
   - If missing, this is your problem!

## 🔧 Step 2: Fix Missing Proxy Integration

If `{proxy+}` resource is missing:

1. **In API Gateway Resources:**
   - Click on the root `/` resource
   - Click **Actions → Create Resource**
   - **Configure as proxy resource:** ✅ Check this box
   - **Resource Name:** `{proxy+}` (auto-fills)
   - **Resource Path:** `{proxy+}` (auto-fills)
   - **Enable API Gateway CORS:** ✅ Check this box
   - Click **Create Resource**

2. **Set up ANY method:**
   - Click on the new `{proxy+}` resource
   - Click **Actions → Create Method**
   - Select **ANY** from dropdown
   - Click the checkmark ✓
   
3. **Configure Integration:**
   - **Integration type:** Lambda Function
   - **Use Lambda Proxy Integration:** ✅ Check this box
   - **Lambda Region:** ap-south-1
   - **Lambda Function:** visitor-management-api (your function name)
   - Click **Save**
   - Click **OK** when prompted about permissions

## 🚀 Step 3: Deploy the Changes

**CRITICAL:** After making changes, you MUST deploy:

1. **Click Actions → Deploy API**
2. **Deployment stage:** prod
3. **Deployment description:** "Add proxy integration"
4. **Click Deploy**

## ✅ Step 4: Test Again

After deployment, test these URLs:

```bash
# Test root (should return FastAPI message or 404 from your app, not API Gateway)
https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/

# Test docs (should return HTML page)
https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/docs

# Test API endpoint
https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod/api/visitors/stats
```

## 🔍 Alternative: Check CloudWatch Logs

1. **Go to AWS Console → CloudWatch**  `
2. **Log groups → /aws/lambda/visitor-management-api**
3. **Check recent logs:**
   - If NO logs appear when you test → API Gateway isn't reaching Lambda
   - If logs show errors → Lambda function issue

## 🛠️ Quick Verification Commands

Run these to test after fixing:

```python
# Test the API Gateway after fixes
python -c "
import requests

base_url = 'https://lqkztx88j1.execute-api.ap-south-1.amazonaws.com/prod'

# Test root endpoint
try:
    response = requests.get(f'{base_url}/')
    print(f'Root endpoint: {response.status_code}')
    print(f'Response: {response.text[:200]}')
except Exception as e:
    print(f'Error: {e}')

# Test docs endpoint  
try:
    response = requests.get(f'{base_url}/docs')
    print(f'Docs endpoint: {response.status_code}')
    print(f'Content-Type: {response.headers.get(\"content-type\", \"unknown\")}')
except Exception as e:
    print(f'Error: {e}')
"
```

## Expected Results After Fix:

- **Root `/`:** Should return FastAPI default response or your custom response
- **`/docs`:** Should return HTML (FastAPI documentation page)
- **`/api/visitors/stats`:** Should return 401/403 (authentication required) or visitor stats

The key issue is likely the **missing proxy integration** - this is required for FastAPI to work with API Gateway!