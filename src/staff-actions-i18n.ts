// Staff-only queue actions, including the destination consultation room.
export const staffActionText:Record<string,{callToRoom:string,reopenVisit:string,reopenConfirm:string,sendToEnd:string,completeFirst:string}>={
 en:{callToRoom:'Call to room',reopenVisit:'Reopen visit',reopenConfirm:'Reopen this completed visit and return it to the waiting queue?',sendToEnd:'Send to end',completeFirst:'Finish the current consultation before calling this ticket'},
 hi:{callToRoom:'कमरे में बुलाएँ',reopenVisit:'विज़िट फिर खोलें',reopenConfirm:'पूरी हुई विज़िट को फिर से प्रतीक्षा सूची में डालें?',sendToEnd:'कतार के अंत में भेजें',completeFirst:'इस टिकट को बुलाने से पहले वर्तमान परामर्श पूरा करें'},
 ta:{callToRoom:'அறைக்கு அழை',reopenVisit:'வருகையை மீண்டும் திற',reopenConfirm:'முடிந்த வருகையை மீண்டும் காத்திருப்பு வரிசையில் சேர்க்கவா?',sendToEnd:'வரிசையின் இறுதிக்கு அனுப்பு',completeFirst:'இந்த டோக்கனை அழைப்பதற்கு முன் நடப்பு ஆலோசனையை முடிக்கவும்'},
 te:{callToRoom:'గదికి పిలవండి',reopenVisit:'సందర్శనను మళ్లీ తెరవండి',reopenConfirm:'పూర్తయిన సందర్శనను తిరిగి వేచి ఉన్న క్యూలోకి చేర్చాలా?',sendToEnd:'క్యూ చివరకు పంపండి',completeFirst:'ఈ టోకెన్‌ను పిలవడానికి ముందు ప్రస్తుత సంప్రదింపును పూర్తి చేయండి'},
 ml:{callToRoom:'മുറിയിലേക്ക് വിളിക്കുക',reopenVisit:'സന്ദർശനം വീണ്ടും തുറക്കുക',reopenConfirm:'പൂർത്തിയായ സന്ദർശനം വീണ്ടും കാത്തിരിപ്പ് നിരയിലേക്കു ചേർക്കണോ?',sendToEnd:'നിരയുടെ അവസാനത്തിലേക്ക് അയയ്ക്കുക',completeFirst:'ഈ ടോക്കൺ വിളിക്കുന്നതിന് മുമ്പ് നിലവിലെ പരിശോധന പൂർത്തിയാക്കുക'},
 kn:{callToRoom:'ಕೊಠಡಿಗೆ ಕರೆ',reopenVisit:'ಭೇಟಿಯನ್ನು ಮತ್ತೆ ತೆರೆಯಿರಿ',reopenConfirm:'ಪೂರ್ಣಗೊಂಡ ಭೇಟಿಯನ್ನು ಮತ್ತೆ ಕಾಯುವ ಸರತಿಗೆ ಸೇರಿಸಬೇಕೆ?',sendToEnd:'ಸರತಿಯ ಕೊನೆಗೆ ಕಳುಹಿಸಿ',completeFirst:'ಈ ಟೋಕನ್ ಕರೆಯುವ ಮೊದಲು ಪ್ರಸ್ತುತ ಸಮಾಲೋಚನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ'}
};
