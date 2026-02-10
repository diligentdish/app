#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time
import uuid
from pymongo import MongoClient

class SubscriptionTester:
    def __init__(self, base_url="https://faith-fit-belly.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        
        # MongoDB connection
        self.client = MongoClient("mongodb://localhost:27017")
        self.db = self.client["test_database"]
        
    def log(self, message):
        print(f"{datetime.now().strftime('%H:%M:%S')} | {message}")
    
    def create_test_user_with_subscription(self):
        """Create a test user and give them an active subscription"""
        timestamp = int(time.time())
        email = f"subtest{timestamp}@example.com"
        password = "SubTest123!"
        
        # Register user via API
        response = requests.post(f"{self.base_url}/api/auth/register", json={
            "name": "Subscription Test User",
            "email": email, 
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['token']
            self.user_id = data['user']['user_id']
            self.log(f"✅ Test user created: {email}")
            
            # Create active subscription in database
            subscription_doc = {
                "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
                "user_id": self.user_id,
                "plan": "beta_monthly",
                "status": "active",
                "amount": 9.0,
                "started_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            self.db.subscriptions.insert_one(subscription_doc)
            self.log("✅ Active subscription created in database")
            return True
        else:
            self.log(f"❌ Failed to create test user: {response.status_code}")
            return False
    
    def test_dashboard_checkin_flow(self):
        """Test the daily check-in flow"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }
        
        # Test getting today's check-in (should be empty first)
        response = requests.get(f"{self.base_url}/api/checkin/today", 
                              headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if not data.get('has_checkin'):
                self.log("✅ No existing check-in found (as expected)")
                
                # Submit a check-in
                checkin_data = {"signal": "stressed"}
                response = requests.post(f"{self.base_url}/api/checkin",
                                       json=checkin_data, headers=headers)
                
                if response.status_code == 200:
                    checkin_result = response.json()
                    self.log("✅ Daily check-in submitted successfully")
                    self.log(f"   BASE category: {checkin_result.get('base_category')}")
                    self.log(f"   Action: {checkin_result.get('action', {}).get('text', 'N/A')[:50]}...")
                    
                    # Test getting today's check-in again
                    response = requests.get(f"{self.base_url}/api/checkin/today", 
                                          headers=headers)
                    if response.status_code == 200 and response.json().get('has_checkin'):
                        self.log("✅ Check-in data retrieved successfully")
                        return True
                    
                else:
                    self.log(f"❌ Check-in submission failed: {response.status_code}")
            else:
                self.log("ℹ️  Check-in already exists for today")
                return True
        else:
            self.log(f"❌ Failed to get today's check-in: {response.status_code}")
            
        return False
    
    def test_trigger_library(self):
        """Test trigger library access"""
        headers = {
            'Content-Type': 'application/json', 
            'Authorization': f'Bearer {self.token}'
        }
        
        response = requests.get(f"{self.base_url}/api/triggers", headers=headers)
        
        if response.status_code == 200:
            triggers = response.json()
            self.log(f"✅ Trigger library accessible - found {len(triggers)} triggers")
            
            if len(triggers) > 0:
                # Test specific trigger type
                first_trigger = triggers[0]
                trigger_type = first_trigger.get('trigger_type')
                
                response = requests.get(f"{self.base_url}/api/triggers/{trigger_type}", 
                                      headers=headers)
                if response.status_code == 200:
                    self.log(f"✅ Specific trigger type '{trigger_type}' accessible")
                    return True
                else:
                    self.log(f"❌ Failed to get specific trigger: {response.status_code}")
            return True
        else:
            self.log(f"❌ Trigger library access failed: {response.status_code}")
            return False
    
    def cleanup(self):
        """Clean up test data"""
        try:
            if self.user_id:
                # Remove test user and subscription
                self.db.users.delete_one({"user_id": self.user_id})
                self.db.subscriptions.delete_one({"user_id": self.user_id})
                self.db.daily_checkins.delete_many({"user_id": self.user_id})
                self.log("✅ Test data cleaned up")
        except Exception as e:
            self.log(f"⚠️  Cleanup warning: {e}")
        finally:
            self.client.close()
    
    def run_subscription_tests(self):
        """Run full subscription feature tests"""
        self.log("🧪 Testing Subscription Features")
        self.log("="*50)
        
        try:
            if not self.create_test_user_with_subscription():
                return False
            
            dashboard_success = self.test_dashboard_checkin_flow()
            trigger_success = self.test_trigger_library()
            
            self.log("="*50)
            if dashboard_success and trigger_success:
                self.log("🎉 All subscription features working!")
                return True
            else:
                self.log("⚠️  Some subscription features had issues")
                return False
                
        finally:
            self.cleanup()

def main():
    tester = SubscriptionTester()
    success = tester.run_subscription_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())