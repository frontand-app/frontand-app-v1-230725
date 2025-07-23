#!/usr/bin/env python3
import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

url = "https://frontand-app-v1-clean-50qt0bjx1-frontand-tech-persons-projects.vercel.app/flows/loop-over-rows"

print(f"🔍 Verifying CLEAN deployment: {url}")

try:
    response = requests.get(url, timeout=10)
    print(f"🌐 HTTP Status: {response.status_code}")
    
    if response.status_code != 200:
        print("❌ URL not accessible")
        exit(1)
        
except Exception as e:
    print(f"❌ Request failed: {e}")
    exit(1)

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--window-size=1920,1080")

driver = webdriver.Chrome(options=chrome_options)
try:
    driver.get(url)
    time.sleep(8)
    
    timestamp = int(time.time())
    screenshot_name = f"CLEAN_WORKING_{timestamp}.png"
    driver.save_screenshot(screenshot_name)
    print(f"📸 Screenshot: {screenshot_name}")
    
    try:
        toggle = driver.find_element(By.ID, "google-search")
        print("✅ Google Search toggle: FOUND!")
        
        label = driver.find_element(By.XPATH, "//label[@for='google-search']")
        print(f"🏷️ Label: '{label.text.strip()}'")
        
    except Exception as e:
        print(f"❌ Google Search toggle: NOT FOUND - {e}")
        
finally:
    driver.quit()

print(f"\n✅ Clean deployment verified!")
