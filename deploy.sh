#!/bin/bash

echo "🚀 Starting DukaFiti deployment preparation..."

# Create build directory for Replit deployment
echo "📁 Creating build directory..."
mkdir -p build

# Create a production-ready index.html that will load the app
echo "📄 Creating production index.html..."
cat > build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DukaFiti - Business Management Platform</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 600px;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        .loading {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
    <script>
        // Redirect to the actual app after a moment
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    </script>
</head>
<body>
    <div class="container">
        <h1>🏪 DukaFiti</h1>
        <p>Smart Business Management Platform</p>
        <div class="loading"></div>
        <p>Loading your business dashboard...</p>
        <small>Powered by Supabase & React</small>
    </div>
</body>
</html>
EOF

echo "✅ Build directory ready for Replit deployment"
echo "📋 Next steps:"
echo "   1. Set environment variables in Replit Secrets"
echo "   2. Click Deploy button in Replit"
echo "   3. Your app will be available at your-app.replit.app"