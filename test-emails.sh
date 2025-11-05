#!/bin/bash

echo "=================================================="
echo "Testing Email Notifications (Mock Mode)"
echo "=================================================="
echo ""
echo "This script tests email logic WITHOUT sending real emails"
echo ""

# Create test-logs directory if it doesn't exist
mkdir -p test-logs

echo "✅ Created test-logs/ directory"
echo ""

# Run the test script
echo "🧪 Running email tests..."
echo ""

node test-email-notifications-mock.js

echo ""
echo "=================================================="
echo "Test Complete!"
echo "=================================================="
echo ""
echo "📁 Check test-logs/ directory for email files:"
echo "   ls -la test-logs/"
echo ""
ls -la test-logs/ 2>/dev/null || echo "No emails logged yet (directory empty)"
echo ""
echo "To view an email in your browser:"
echo "   open test-logs/email_*.html"
echo ""
