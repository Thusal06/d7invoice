#!/usr/bin/env python3
"""
Simple HTTP server to test the D7 Invoice application locally.
This avoids CORS issues that occur with file:// protocol.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # Custom log messages
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"Starting D7 Invoice Server...")
            print(f"Server running at: http://localhost:{PORT}")
            print(f"Serving directory: {os.getcwd()}")
            print(f"Main application: http://localhost:{PORT}/index.html")
            print(f"Template analysis: http://localhost:{PORT}/template_analysis.html")
            print(f"Debug tools: http://localhost:{PORT}/debug_image.html")
            print("Press Ctrl+C to stop the server")
            print("-" * 50)

            # Open browser automatically
            webbrowser.open(f'http://localhost:{PORT}/index.html')

            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"Port {PORT} is already in use. Please try a different port.")
        else:
            print(f"Error starting server: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)