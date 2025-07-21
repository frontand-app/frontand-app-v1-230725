#!/usr/bin/env python3
"""
Automated Deployment Checker
Takes a screenshot of the Vercel deployment to verify it's working
"""

import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
from datetime import datetime

# Configuration
URL = "https://frontand-app-v1-frontand-tech-persons-projects.vercel.app"
SCREENSHOT_PATH = "deployment_check.png"

def check_url_status():
    """Check if the URL is accessible"""
    try:
        response = requests.get(URL, timeout=10, allow_redirects=True)
        print(f"✅ URL Status: {response.status_code}")
        print(f"📍 Final URL: {response.url}")
        print(f"📋 Headers: {dict(list(response.headers.items())[:5])}")  # First 5 headers
        
        if response.status_code == 401:
            print("🔐 AUTHENTICATION REQUIRED!")
            print("   This explains the blank page - Vercel has auth protection enabled")
            return "auth_required"
        elif response.status_code in [200, 301, 302]:
            return True
        else:
            return False
    except Exception as e:
        print(f"❌ URL Error: {e}")
        return False

def take_screenshot():
    """Take a screenshot of the webpage"""
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1280,720")
    chrome_options.add_argument("--disable-web-security")  # For auth testing
    
    driver = None
    try:
        # Initialize Chrome driver
        driver = webdriver.Chrome(options=chrome_options)
        
        print(f"🌐 Loading: {URL}")
        driver.get(URL)
        
        # Wait for page to load
        time.sleep(5)  # Longer wait for auth pages
        
        # Take screenshot regardless of content
        driver.save_screenshot(SCREENSHOT_PATH)
        print(f"📸 Screenshot saved: {SCREENSHOT_PATH}")
        
        # Get page title and some basic info
        title = driver.title
        print(f"📄 Page Title: {title}")
        
        # Get current URL (might be redirected)
        current_url = driver.current_url
        print(f"📍 Current URL: {current_url}")
        
        # Check if page has content
        try:
            body_text = driver.find_element(By.TAG_NAME, "body").text
            if body_text.strip():
                print(f"✅ Page has content ({len(body_text)} characters)")
                print(f"🔍 First 300 chars: {body_text[:300]}")
            else:
                print("❌ Page appears blank/empty")
                
            # Check for common auth elements
            auth_indicators = ["sign in", "login", "password", "unauthorized", "access denied"]
            for indicator in auth_indicators:
                if indicator.lower() in body_text.lower():
                    print(f"🔐 AUTH DETECTED: Found '{indicator}' in page content")
                    
        except Exception as e:
            print(f"⚠️ Could not read page content: {e}")
            
        return True
        
    except Exception as e:
        print(f"❌ Screenshot Error: {e}")
        return False
    finally:
        if driver:
            driver.quit()

def main():
    """Main function"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n🚀 Front& Deployment Check - {timestamp}")
    print("=" * 50)
    
    # Check URL accessibility
    status = check_url_status()
    
    if status == "auth_required":
        print("\n🔐 DIAGNOSIS: Vercel has authentication protection enabled!")
        print("   This is why the page appears blank - it's showing an auth challenge")
        print("   To fix: Disable Vercel authentication in project settings")
        
    elif status == False:
        print("\n❌ URL is not accessible, cannot take screenshot")
        return
    
    # Take screenshot anyway to see what's displayed
    print("\n📸 Taking screenshot to see current state...")
    if take_screenshot():
        print(f"\n✅ Check complete! Screenshot saved as '{SCREENSHOT_PATH}'")
        print(f"📁 Full path: {os.path.abspath(SCREENSHOT_PATH)}")
    else:
        print("\n❌ Failed to take screenshot")

if __name__ == "__main__":
    main() 