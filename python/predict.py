"""Optional prediction service. Run: python python/predict.py (stdlib only)."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/predict':
            self.send_error(404); return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if size > 10000: raise ValueError('Request too large')
            data = json.loads(self.rfile.read(size))
            ahead = int(data.get('ahead', 0))
            if not 0 <= ahead <= 1000: raise ValueError('ahead must be between 0 and 1000')
            samples = [float(x) for x in data.get('consultations', [6])]
            if not samples or any(not 0 < x <= 240 for x in samples): raise ValueError('Invalid consultation durations')
            average = samples[0]
            for sample in samples[1:]: average = .3 * sample + .7 * average
            minutes = ahead * average + (15 if data.get('on_break') else 0)
            payload = json.dumps({'minutes': round(minutes), 'range': [round(minutes*.8),round(minutes*1.2)],'method':'EWMA','simulated':True}).encode()
            self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(payload)
        except (ValueError, TypeError, KeyError): self.send_error(400, 'Invalid prediction input')
if __name__ == '__main__':
    print('Optional prediction service at http://127.0.0.1:8000')
    HTTPServer(('127.0.0.1',8000), Handler).serve_forever()
