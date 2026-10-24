"""Optional local EWMA service. Run: python python/predict.py (standard library only)."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import math

def predict(data):
    if not isinstance(data, dict):
        raise ValueError('Expected an object')
    ahead = data.get('ahead', 0)
    on_break = data.get('on_break', False)
    samples = data.get('consultations', [6])
    if type(ahead) is not int or not 0 <= ahead <= 1000 or type(on_break) is not bool:
        raise ValueError('Invalid queue inputs')
    if not isinstance(samples, list) or not samples or any(type(x) not in (int, float) or not math.isfinite(x) or not 0 < x <= 240 for x in samples):
        raise ValueError('Invalid consultation durations')
    average = samples[0]
    for sample in samples[1:]:
        average = .3 * sample + .7 * average
    minutes = ahead * average + (15 if on_break else 0)
    # Match JavaScript Math.round for these non-negative values.
    rounded = lambda x: math.floor(x + .5)
    return {'minutes': rounded(minutes), 'range': [rounded(minutes*.8), rounded(minutes*1.2)], 'method': 'EWMA', 'simulated': True}

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/predict':
            self.send_error(404)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 10000:
                raise ValueError('Invalid request size')
            result = predict(json.loads(self.rfile.read(size)))
            payload = json.dumps(result).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(payload)
        except (ValueError, TypeError, KeyError):
            self.send_error(400, 'Invalid prediction input')

if __name__ == '__main__':
    print('Optional prediction service at http://127.0.0.1:8000')
    HTTPServer(('127.0.0.1', 8000), Handler).serve_forever()
