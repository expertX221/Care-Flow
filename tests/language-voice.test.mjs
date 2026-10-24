import test from 'node:test';
import assert from 'node:assert/strict';
import {announceSelectedLanguage, englishLanguageNames} from '../lib/language-voice.mjs';

function mockSpeech(voices) {
  const calls=[];
  const synth={getVoices:()=>voices,cancel:()=>calls.push('cancel'),speak:u=>calls.push(u)};
  class Utterance {constructor(text){this.text=text;}}
  return {synth,Utterance,calls};
}
test('all six supported languages have English labels',()=>{
  assert.deepEqual(Object.keys(englishLanguageNames),['en','hi','ta','te','ml','kn']);
});
test('speaks Hindi in Hindi when a matching voice exists',()=>{
  const v={lang:'hi-IN'},m=mockSpeech([v,{lang:'en-US'}]);
  assert.equal(announceSelectedLanguage('hi','हिन्दी','hi-IN',m.synth,m.Utterance),true);
  assert.equal(m.calls[0],'cancel');
  assert.equal(m.calls[1].text,'हिन्दी');
  assert.equal(m.calls[1].lang,'hi-IN');
  assert.equal(m.calls[1].voice,v);
});
test('speaks language name in English if its native voice is missing',()=>{
  const v={lang:'en-US'},m=mockSpeech([v]);
  assert.equal(announceSelectedLanguage('ta','தமிழ்','ta-IN',m.synth,m.Utterance),true);
  assert.equal(m.calls[1].text,'Tamil');
  assert.equal(m.calls[1].lang,'en-US');
});
test('lets a browser with an unloaded voice list choose a native voice',()=>{
  const m=mockSpeech([]);
  assert.equal(announceSelectedLanguage('te','తెలుగు','te-IN',m.synth,m.Utterance),true);
  assert.equal(m.calls[1].text,'తెలుగు');
  assert.equal(m.calls[1].lang,'te-IN');
});
test('gracefully handles browsers without speech synthesis',()=>{
  assert.equal(announceSelectedLanguage('kn','ಕನ್ನಡ','kn-IN',null,undefined),false);
  const m=mockSpeech([]);
  assert.equal(announceSelectedLanguage('invalid','invalid','xx',m.synth,m.Utterance),false);
  assert.equal(m.calls.length,0);
});
