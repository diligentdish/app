#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time
import uuid

class BlessedBellyAPITester:
    def __init__(self, base_url="https://faith-fit-belly.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.admin_user_id = None

    def log(self, message):
        print(f"{datetime.now().strftime('%H:%M:%S')} | {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, require_auth=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        test_headers = {'Content-Type': 'application/json'}
        if require_auth and self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"   Error: {error_data}")
                except:
                    self.log(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.headers.get('content-type') == 'application/json' and response.text else {}

        except requests.exceptions.Timeout:
            self.log(f"❌ {name} - Request timed out after 30 seconds")
            return False, {}
        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        success, _ = self.run_test("API Health Check", "GET", "", 200)
        return success

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        email = f"testuser{timestamp}@example.com"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "name": "Test User",
                "email": email,
                "password": "TestPass123!"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            self.log(f"   Registered user: {email}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            return False
            
        # Try to login with the registered user (we'll create a known user first)
        timestamp = int(time.time())
        email = f"logintest{timestamp}@example.com"
        password = "LoginTest123!"
        
        # Register first
        success, reg_response = self.run_test(
            "Register for Login Test",
            "POST", 
            "auth/register",
            200,
            data={"name": "Login Test", "email": email, "password": password}
        )
        
        if not success:
            return False
            
        # Now test login
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login", 
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'token' in response:
            self.log(f"   Login successful for: {email}")
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            require_auth=True
        )
        return success and 'user_id' in response

    def test_admin_registration(self):
        """Test admin user registration"""
        timestamp = int(time.time())
        admin_email = "admin@blessedbelly.com"  # This should get admin role
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register", 
            200,
            data={
                "name": "Admin User",
                "email": admin_email,
                "password": "AdminPass123!"
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user_id = response['user']['user_id']
            if response['user'].get('role') == 'admin':
                self.log(f"   Admin user registered successfully")
                return True
            else:
                self.log(f"   Warning: User registered but not as admin")
        return False

    def test_seed_data(self):
        """Test seeding initial data"""
        success, response = self.run_test(
            "Seed Initial Data",
            "POST",
            "admin/seed",
            200
        )
        return success

    def test_subscription_creation(self):
        """Test subscription workflow"""
        if not self.user_id:
            return False
            
        # Create checkout session
        success, response = self.run_test(
            "Create Checkout Session",
            "POST",
            "checkout/session",
            200,
            data={"origin_url": "https://blessedbelly.com"},
            require_auth=True
        )
        
        if success and 'session_id' in response:
            session_id = response['session_id']
            self.log(f"   Checkout session created: {session_id}")
            
            # Test getting checkout status
            success2, _ = self.run_test(
                "Get Checkout Status",
                "GET",
                f"checkout/status/{session_id}",
                200,
                require_auth=True
            )
            return success and success2
            
        return False

    def test_subscription_endpoints(self):
        """Test subscription status endpoint"""
        success, response = self.run_test(
            "Get Subscription Status",
            "GET",
            "subscription/status",
            200,
            require_auth=True
        )
        return success

    def create_test_subscription(self):
        """Create a test subscription for dashboard testing"""
        if not self.user_id:
            return False
            
        self.log("Creating test subscription for dashboard testing...")
        # We'll manually insert a subscription for testing purposes
        return True  # Skip for now since we need DB access

    def test_daily_checkin_protected(self):
        """Test that daily checkin requires subscription"""
        success, response = self.run_test(
            "Daily Checkin (No Subscription)",
            "POST", 
            "checkin",
            403,  # Should be forbidden without subscription
            data={"signal": "normal"},
            require_auth=True
        )
        return success  # Success means we got the expected 403

    def test_trigger_library_protected(self):
        """Test that trigger library requires subscription"""
        success, response = self.run_test(
            "Get Triggers (No Subscription)",
            "GET",
            "triggers", 
            403,  # Should be forbidden without subscription
            require_auth=True
        )
        return success  # Success means we got the expected 403

    def test_admin_endpoints(self):
        """Test admin functionality"""
        if not self.admin_token:
            self.log("Skipping admin tests - no admin token")
            return False
            
        # Store original token
        original_token = self.token
        self.token = self.admin_token
        
        # Test getting actions
        success1, _ = self.run_test(
            "Get BASEline Actions (Admin)",
            "GET",
            "admin/actions",
            200,
            require_auth=True
        )
        
        # Test getting triggers
        success2, _ = self.run_test(
            "Get Trigger Cards (Admin)",
            "GET",
            "admin/triggers", 
            200,
            require_auth=True
        )
        
        # Test getting verses
        success3, _ = self.run_test(
            "Get Verses (Admin)",
            "GET",
            "admin/verses",
            200,
            require_auth=True
        )
        
        # Restore original token
        self.token = original_token
        
        return success1 and success2 and success3

    def test_unauthorized_access(self):
        """Test that protected endpoints reject unauthorized requests"""
        # Store token and clear it
        original_token = self.token
        self.token = None
        
        success1, _ = self.run_test(
            "Dashboard Access (No Auth)",
            "GET",
            "checkin/today",
            401
        )
        
        success2, _ = self.run_test(
            "Trigger Library (No Auth)", 
            "GET",
            "triggers",
            401
        )
        
        success3, _ = self.run_test(
            "Admin Access (No Auth)",
            "GET", 
            "admin/actions",
            401
        )
        
        # Restore token
        self.token = original_token
        
        return success1 and success2 and success3

    def run_all_tests(self):
        """Run the complete test suite"""
        self.log("🚀 Starting Blessed Belly API Test Suite")
        self.log("="*60)
        
        # Basic connectivity
        if not self.test_health_check():
            self.log("❌ API is not accessible. Stopping tests.")
            return False
            
        # Seed data first
        self.test_seed_data()
        
        # Auth tests
        self.test_user_registration()
        self.test_user_login()
        self.test_auth_me()
        
        # Admin setup
        self.test_admin_registration()
        
        # Subscription tests
        self.test_subscription_creation()
        self.test_subscription_endpoints()
        
        # Protected endpoint tests
        self.test_daily_checkin_protected()
        self.test_trigger_library_protected()
        
        # Admin tests
        self.test_admin_endpoints()
        
        # Security tests  
        self.test_unauthorized_access()
        
        # Summary
        self.log("="*60)
        self.log(f"📊 RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        self.log(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All tests passed!")
            return True
        else:
            self.log("⚠️  Some tests failed - see details above")
            return False

def main():
    tester = BlessedBellyAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())