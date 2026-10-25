import unittest
from predict import predict
class PredictionTests(unittest.TestCase):
    def test_estimate(self):
        self.assertEqual(predict({'ahead':3})['minutes'],18)
    def test_break(self):
        self.assertEqual(predict({'ahead':3,'on_break':True})['minutes'],33)
    def test_ewma(self):
        self.assertEqual(predict({'ahead':3,'consultations':[6,7,5]})['minutes'],18)
    def test_bad_types(self):
        for value in [None,[],{'ahead':True},{'ahead':-1},{'ahead':1,'on_break':'false'}]:
            with self.assertRaises(ValueError):predict(value)
    def test_bad_samples(self):
        for value in [[],[True],['6'],[0],[float('nan')],[float('inf')],[241]]:
            with self.assertRaises(ValueError):predict({'ahead':2,'consultations':value})
    def test_js_rounding(self):
        self.assertEqual(predict({'ahead':1,'consultations':[2.5]})['minutes'],3)
if __name__=='__main__':unittest.main()
