import type { TranslationLanguage } from "./languages";

export type TranslationKeys = {
  title: string;
  subtitle: string;
  poweredBy: string;
  patientDetails: string;
  captureContext: string;
  patientIdLabel: string;
  patientNameLabel: string;
  ageLabel: string;
  genderLabel: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  genderPreferNot: string;
  locationLabel: string;
  wardLabel: string;
  chiefComplaintLabel: string;
  preferredLanguage: string;
  namePlaceholder: string;
  locationPlaceholder: string;
  wardPlaceholder: string;
  chiefComplaintPlaceholder: string;
  startBtn: string;
  stopBtn: string;
  listening: string;
  transcriptTitle: string;
  transcriptWaiting: string;
  manualPlaceholder: string;
  saveCase: string;
  newTriage: string;
  dashboard: string;
  openDashboard: string;
  systemLive: string;
  systemChecking: string;
  systemDegraded: string;
  systemOffline: string;
  startingSpeech: string;
  transcriptPreview: string;
  speechApiLabel: string;
  micFooter: string;
  assignedPriority: string;
  aiTriageTag: string;
  priorityCritical: string;
  priorityUrgent: string;
  priorityNonUrgent: string;
  analyzing: string;
  analyzingSlow: string;
  clinicalSummary: string;
  whatsHappening: string;
  specialistNeeded: string;
  medicationsToAvoid: string;
  immediateActions: string;
  warningSigns: string;
  warningSignsSubtitle: string;
  doNotDo: string;
  doNotDoSubtitle: string;
  emergencyContacts: string;
  facilityTitle: string;
  getDirections: string;
  estimatedTime: string;
  followUp: string;
  icdCode: string;
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
  printResult: string;
  printActions: string;
  replayAudio: string;
  muteAudio: string;
  unmuteAudio: string;
  speaking: string;
  messageDelivered: string;
  tapToHear: string;
  caseSaved: string;
  saving: string;
  lightMode: string;
  darkMode: string;
  searchLanguage: string;
  none: string;
  hospital: string;
  clinic: string;
  pharmacy: string;
  facilityTypeLabel: string;
  brandSubtitle: string;
  resultTitle: string;
  nearestHospitals: string;
  emergencyBanner: string;
  detectLocation: string;
  locationDenied: string;
  locationDetecting: string;
  speakClearly: string;
  agePlaceholder: string;
  openNow: string;
  closedNow: string;
  callBtn: string;
  nearestEmergencyBadge: string;
  callEmergency: string;
  noHospitalsNearby: string;
  clinicalReasoning: string;
};

const en: TranslationKeys = {
  title: "Emergency Health Triage",
  subtitle: "Speak your symptoms in any language. AI will assess and guide you.",
  brandSubtitle: "Emergency Triage System",
  poweredBy: "Powered by RuralCare",
  patientDetails: "Patient Details",
  captureContext: "Complete details before voice assessment.",
  patientIdLabel: "Patient ID",
  patientNameLabel: "Patient name",
  ageLabel: "Age",
  genderLabel: "Gender",
  genderMale: "Male",
  genderFemale: "Female",
  genderOther: "Other",
  genderPreferNot: "Prefer not to say",
  locationLabel: "Location / village",
  wardLabel: "Ward",
  chiefComplaintLabel: "Chief complaint (optional)",
  preferredLanguage: "Preferred language",
  namePlaceholder: "Full name",
  agePlaceholder: "Age in years",
  locationPlaceholder: "Village, town, or district",
  wardPlaceholder: "Select ward",
  chiefComplaintPlaceholder: "Brief description before speaking…",
  startBtn: "Tap to begin",
  stopBtn: "Stop & Analyze",
  listening: "Listening… speak now",
  transcriptTitle: "Live Transcript",
  transcriptWaiting: "Tap the microphone to begin.",
  manualPlaceholder: "Or type symptoms manually…",
  saveCase: "Save case",
  newTriage: "New triage",
  dashboard: "Dashboard",
  openDashboard: "Open dashboard",
  systemLive: "System Online",
  systemDegraded: "Degraded",
  systemChecking: "Checking…",
  systemOffline: "System offline",
  startingSpeech: "Starting speech recognition…",
  transcriptPreview: "Updates as you speak",
  speechApiLabel: "Web Speech API",
  micFooter: "Voice intake uses browser speech recognition with manual fallback.",
  assignedPriority: "Triage priority",
  aiTriageTag: "AI assessment",
  priorityCritical: "Critical",
  priorityUrgent: "Urgent",
  priorityNonUrgent: "Non-Urgent",
  analyzing: "Analyzing symptoms…",
  analyzingSlow: "Analysis taking longer than usual…",
  resultTitle: "Triage Result",
  clinicalSummary: "Clinical summary",
  whatsHappening: "What's happening",
  specialistNeeded: "Specialist needed",
  medicationsToAvoid: "Medications to avoid",
  immediateActions: "Immediate Actions",
  warningSigns: "Warning Signs",
  warningSignsSubtitle: "If you see these, call 1990 immediately",
  doNotDo: "Do not do",
  doNotDoSubtitle: "Critical contraindications",
  emergencyContacts: "Emergency contacts",
  emergencyBanner: "Call emergency services immediately",
  facilityTitle: "Nearest Hospitals",
  nearestHospitals: "Nearby Hospitals",
  getDirections: "Get Directions",
  estimatedTime: "Estimated time to care",
  followUp: "Follow-up",
  icdCode: "ICD-10",
  confidenceHigh: "High confidence",
  confidenceMedium: "Medium confidence",
  confidenceLow: "Low confidence",
  printResult: "Print triage card",
  printActions: "Print action card",
  replayAudio: "Hear this again",
  muteAudio: "Mute audio",
  unmuteAudio: "Unmute audio",
  speaking: "Speaking…",
  messageDelivered: "Message delivered",
  tapToHear: "Tap to hear your result",
  caseSaved: "Case saved",
  saving: "Saving…",
  lightMode: "Light mode",
  darkMode: "Dark mode",
  searchLanguage: "Search languages…",
  none: "None",
  hospital: "Hospital",
  clinic: "Clinic",
  pharmacy: "Pharmacy",
  facilityTypeLabel: "Recommended facility",
  detectLocation: "Detect my location",
  locationDenied: "Location permission denied. Enter manually.",
  locationDetecting: "Detecting location…",
  speakClearly: "Speak clearly",
  openNow: "Open now",
  closedNow: "Closed",
  callBtn: "Call",
  nearestEmergencyBadge: "NEAREST EMERGENCY FACILITY",
  callEmergency: "Call 1990 immediately for an ambulance",
  noHospitalsNearby: "No hospitals found nearby — call 1990 for emergency ambulance",
  clinicalReasoning: "Clinical reasoning (staff)",
};

export const translations: Record<TranslationLanguage, TranslationKeys> = {
  english: en,
  sinhala: {
    ...en,
    title: "හදිසි සෞඛ්‍ය ත්‍රාසනය",
    subtitle: "ඔබේ ලක්ෂණ කතා කරන්න. අපි සෑම භාෂාවක්ම තේරුම් ගනිමු.",
    brandSubtitle: "හදිසි ත්‍රාසන පද්ධතිය",
    patientDetails: "රෝගියාගේ විස්තර",
    startBtn: "ආරම්භ කිරීමට තට්ටු කරන්න",
    stopBtn: "නවතා විශ්ලේෂණය",
    listening: "සවන් දෙමින්… පැහැදිලිව කතා කරන්න",
    analyzing: "ලක්ෂණ විශ්ලේෂණය…",
    resultTitle: "ත්‍රාසන ප්‍රතිඵලය",
    whatsHappening: "මොකක් සිදුවෙන්නේ",
    immediateActions: "වහාම කළ යුතු ක්‍රියා",
    warningSigns: "අනතුරු සංඥා",
    doNotDo: "නොකරන්න",
    nearestHospitals: "ළඟම රෝහල්",
    emergencyBanner: "වහාම හදිසි සේවා අමතන්න",
    detectLocation: "📍 මගේ ස්ථානය හඳුනාගන්න",
    systemLive: "● පද්ධතිය සක්‍රියයි",
    saveCase: "වාර්තාවට සුරකින්න",
    dashboard: "පුවරුව",
    callEmergency: "වහාම 1990 අමතන්න",
  },
  tamil: {
    ...en,
    title: "அவசர சுகாதார சோதனை",
    subtitle: "உங்கள் அறிகுறிகளை பேசுங்கள். எல்லா மொழிகளையும் நாங்கள் புரிந்துகொள்கிறோம்.",
    brandSubtitle: "அவசர சோதனை அமைப்பு",
    patientDetails: "நோயாளர் விவரங்கள்",
    patientIdLabel: "நோயாளர் அடையாளம்",
    patientNameLabel: "நோயாளியின் பெயர்",
    agePlaceholder: "வயது",
    genderMale: "ஆண்",
    genderFemale: "பெண்",
    genderPreferNot: "சொல்ல விரும்பவில்லை",
    locationLabel: "இடம் / கிராமம்",
    chiefComplaintPlaceholder: "பேசுவதற்கு முன் சுருக்கமாக…",
    startBtn: "தொடங்க தட்டவும்",
    stopBtn: "நிறுத்தி பகுப்பாய்வு",
    listening: "கேட்கிறோம்… தெளிவாக பேசுங்கள்",
    analyzing: "அறிகுறிகள் பகுப்பாய்வு…",
    transcriptTitle: "நேரடி படியெடுப்பு",
    manualPlaceholder: "அல்லது கைமுறையாக தட்டச்சு செய்யுங்கள்…",
    resultTitle: "சோதனை முடிவு",
    whatsHappening: "என்ன நடக்கிறது",
    immediateActions: "உடனடி நடவடிக்கைகள்",
    warningSigns: "எச்சரிக்கை அறிகுறிகள்",
    doNotDo: "செய்ய வேண்டாம்",
    nearestHospitals: "அருகிலுள்ள மருத்துவமனைகள்",
    facilityTitle: "அருகிலுள்ள மருத்துவமனைகள்",
    emergencyBanner: "உடனடியாக அவசர சேவைகளை அழைக்கவும்",
    saveCase: "வழக்கை சேமி",
    newTriage: "புதிய சோதனை",
    dashboard: "டாஷ்போர்டு",
    detectLocation: "📍 என் இடத்தை கண்டறி",
    systemLive: "● அமைப்பு செயலில்",
    priorityCritical: "அபாயகரம்",
    priorityUrgent: "அவசரம்",
    priorityNonUrgent: "அவசரமில்லை",
    getDirections: "வழிகாட்டுதல்",
    callBtn: "அழை",
    openNow: "திறந்துள்ளது",
    replayAudio: "மீண்டும் கேளுங்கள்",
    speaking: "பேசுகிறது…",
    messageDelivered: "செய்தி வழங்கப்பட்டது",
    tapToHear: "முடிவை கேட்க தட்டவும்",
    callEmergency: "உடனடியாக 1990 ஐ அழைக்கவும்",
  },
  hindi: {
    ...en,
    title: "आपातकालीन स्वास्थ्य ट्राइएज",
    subtitle: "स्पष्ट बोलें। हम आपके लक्षणों का आकलन कर अगले कदम बताएंगे।",
    patientDetails: "रोगी प्रवेश",
    patientNameLabel: "रोगी का नाम",
    locationLabel: "स्थान / गाँव",
    startBtn: "आवाज़ ट्राइएज शुरू करें",
    stopBtn: "रोकें और विश्लेषण करें",
    listening: "सुन रहे हैं…",
    saveCase: "रिकॉर्ड में सहेजें",
    newTriage: "नया ट्राइएज",
    dashboard: "डैशबोर्ड",
    analyzing: "लक्षणों का विश्लेषण…",
    clinicalSummary: "चिकित्सा सारांश",
    immediateActions: "तत्काल कार्य",
    warningSigns: "चेतावनी संकेत",
    doNotDo: "न करें",
    emergencyContacts: "आपातकालीन संपर्क",
    facilityTitle: "निकटतम चिकित्सा सुविधा",
    getDirections: "दिशा-निर्देश",
    printResult: "ट्राइएज कार्ड प्रिंट करें",
    replayAudio: "फिर से सुनें",
    speaking: "बोल रहा है…",
    messageDelivered: "संदेश दिया गया",
    tapToHear: "परिणाम सुनने के लिए टैप करें",
    callEmergency: "तुरंत 1990 पर कॉल करें",
  },
  bengali: {
    ...en,
    title: "জরুরি স্বাস্থ্য ট্রায়াজ",
    subtitle: "স্পষ্টভাবে বলুন। আমরা আপনার লক্ষণ মূল্যায়ন করে পরবর্তী পদক্ষেপ বলব।",
    patientDetails: "রোগী ভর্তি",
    patientNameLabel: "রোগীর নাম",
    locationLabel: "অবস্থান / গ্রাম",
    startBtn: "কণ্ঠস্বর ট্রায়াজ শুরু",
    stopBtn: "থামান ও বিশ্লেষণ",
    listening: "শুনছি…",
    saveCase: "রেকর্ডে সংরক্ষণ",
    newTriage: "নতুন ট্রায়াজ",
    dashboard: "ড্যাশবোর্ড",
    analyzing: "লক্ষণ বিশ্লেষণ…",
    clinicalSummary: "চিকিৎসা সারাংশ",
    immediateActions: "তাৎক্ষণিক পদক্ষেপ",
    warningSigns: "সতর্কতা লক্ষণ",
    doNotDo: "যা করবেন না",
    emergencyContacts: "জরুরি যোগাযোগ",
    facilityTitle: "নিকটতম চিকিৎসা কেন্দ্র",
    getDirections: "দিকনির্দেশ",
    printResult: "ট্রায়াজ কার্ড প্রিন্ট",
    replayAudio: "আবার শুনুন",
    speaking: "বলছে…",
    messageDelivered: "বার্তা পৌঁছে দেওয়া হয়েছে",
    tapToHear: "ফলাফল শুনতে ট্যাপ করুন",
    callEmergency: "অবিলম্বে 1990 কল করুন",
  },
  urdu: {
    ...en,
    title: "ایمرجنسی صحت ٹرائیج",
    subtitle: "واضح بولیں۔ ہم آپ کی علامات کا جائزہ لے کر اگلے قدم بتائیں گے۔",
    patientDetails: "مریض داخلہ",
    patientNameLabel: "مریض کا نام",
    locationLabel: "مقام / گاؤں",
    startBtn: "آواز ٹرائیج شروع",
    stopBtn: "روکیں اور تجزیہ",
    listening: "سن رہے ہیں…",
    saveCase: "ریکارڈ میں محفوظ",
    newTriage: "نیا ٹرائیج",
    dashboard: "ڈیش بورڈ",
    analyzing: "علامات کا تجزیہ…",
    clinicalSummary: "طبی خلاصہ",
    immediateActions: "فوری اقدامات",
    warningSigns: "انتباہی علامات",
    doNotDo: "نہ کریں",
    emergencyContacts: "ہنگامی رابطے",
    facilityTitle: "قریبی طبی سہولت",
    getDirections: "راستہ",
    printResult: "ٹرائیج کارڈ پرنٹ",
    replayAudio: "دوبارہ سنیں",
    speaking: "بول رہا ہے…",
    messageDelivered: "پیغام پہنچایا",
    tapToHear: "نتیجہ سننے کے لیے ٹیپ کریں",
    callEmergency: "فوری طور پر 1990 کال کریں",
  },
  punjabi: {
    ...en,
    title: "ਐਮਰਜੈਂਸੀ ਸਿਹਤ ਟ੍ਰਾਇਅਜ",
    subtitle: "ਸਪਸ਼ਟ ਬੋਲੋ। ਅਸੀਂ ਤੁਹਾਡੇ ਲੱਛਣਾਂ ਦਾ ਮੁਲਾਂਕਣ ਕਰਾਂਗੇ।",
    patientDetails: "ਮਰੀਜ਼ ਦਾਖਲਾ",
    patientNameLabel: "ਮਰੀਜ਼ ਦਾ ਨਾਮ",
    locationLabel: "ਟਿਕਾਣਾ / ਪਿੰਡ",
    startBtn: "ਆਵਾਜ਼ ਟ੍ਰਾਇਅਜ ਸ਼ੁਰੂ",
    stopBtn: "ਰੋਕੋ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ",
    listening: "ਸੁਣ ਰਹੇ ਹਾਂ…",
    saveCase: "ਰਿਕਾਰਡ ਵਿੱਚ ਸੇਵ",
    newTriage: "ਨਵਾਂ ਟ੍ਰਾਇਅਜ",
    dashboard: "ਡੈਸ਼ਬੋਰਡ",
    analyzing: "ਲੱਛਣਾਂ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ…",
    clinicalSummary: "ਡਾਕਟਰੀ ਸਾਰ",
    immediateActions: "ਤੁਰੰਤ ਕਾਰਵਾਈ",
    warningSigns: "ਚੇਤਾਵਨੀ ਦੇ ਨਿਸ਼ਾਨ",
    doNotDo: "ਨਾ ਕਰੋ",
    emergencyContacts: "ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ",
    facilityTitle: "ਨਜ਼ਦੀਕੀ ਮੈਡੀਕਲ ਸਹੂਲਤ",
    getDirections: "ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼",
    printResult: "ਟ੍ਰਾਇਅਜ ਕਾਰਡ ਪ੍ਰਿੰਟ",
    replayAudio: "ਦੁਬਾਰਾ ਸੁਣੋ",
    speaking: "ਬੋਲ ਰਿਹਾ ਹੈ…",
    messageDelivered: "ਸੁਨੇਹਾ ਭੇਜਿਆ",
    tapToHear: "ਨਤੀਜਾ ਸੁਣਨ ਲਈ ਟੈਪ ਕਰੋ",
    callEmergency: "ਤੁਰੰਤ 1990 'ਤੇ ਕਾਲ ਕਰੋ",
  },
  malayalam: {
    ...en,
    title: "അടിയന്തര ആരോഗ്യ ട്രയേജ്",
    subtitle: "വ്യക്തമായി സംസാരിക്കുക. ലക്ഷണങ്ങൾ വിലയിരുത്തി മാർഗനിർദേശം നൽകും.",
    patientDetails: "രോഗി രേഖ",
    patientNameLabel: "രോഗിയുടെ പേര്",
    locationLabel: "സ്ഥലം / ഗ്രാമം",
    startBtn: "ശബ്ദ ട്രയേജ് ആരംഭിക്കുക",
    stopBtn: "നിർത്തി വിശകലനം",
    listening: "കേൾക്കുന്നു…",
    saveCase: "രേഖയിൽ സംരക്ഷിക്കുക",
    newTriage: "പുതിയ ട്രയേജ്",
    dashboard: "ഡാഷ്ബോർഡ്",
    analyzing: "ലക്ഷണങ്ങൾ വിശകലനം…",
    clinicalSummary: "ക്ലിനിക്കൽ സംഗ്രഹം",
    immediateActions: "തൽക്ഷണ നടപടികൾ",
    warningSigns: "മുന്നറിയിപ്പ് അടയാളങ്ങൾ",
    doNotDo: "ചെയ്യരുത്",
    emergencyContacts: "അടിയന്തര ബന്ധങ്ങൾ",
    facilityTitle: "അടുത്തുള്ള medical facility",
    getDirections: "ദിശകൾ",
    printResult: "ട്രയേജ് കാർഡ് പ്രിന്റ്",
    replayAudio: "വീണ്ടും കേൾക്കുക",
    speaking: "സംസാരിക്കുന്നു…",
    messageDelivered: "സന്ദേശം നൽകി",
    tapToHear: "ഫലം കേൾക്കാൻ ടാപ്പ് ചെയ്യുക",
    callEmergency: "ഉടനടി 1990 വിളിക്കുക",
  },
  telugu: {
    ...en,
    title: "అత్యవసర ఆరోగ్య ట్రయేజ్",
    subtitle: "స్పష్టంగా మాట్లాడండి. మీ లక్షణాలను అంచనా వేసి మార్గనిర్దేశం చేస్తాము.",
    patientDetails: "రోగి ప్రవేశం",
    patientNameLabel: "రోగి పేరు",
    locationLabel: "స్థలం / గ్రామం",
    startBtn: "వాయిస్ ట్రయేజ్ ప్రారంభించు",
    stopBtn: "ఆపి విశ్లేషించు",
    listening: "వింటున్నాము…",
    saveCase: "రికార్డులో సేవ్",
    newTriage: "కొత్త ట్రయేజ్",
    dashboard: "డాష్‌బోర్డ్",
    analyzing: "లక్షణాల విశ్లేషణ…",
    clinicalSummary: "క్లినికల్ సారాంశం",
    immediateActions: "తక్షణ చర్యలు",
    warningSigns: "హెచ్చరిక సంకేతాలు",
    doNotDo: "చేయవద్దు",
    emergencyContacts: "అత్యవసర సంప్రదింపులు",
    facilityTitle: "సమీప వైద్య సౌకర్యం",
    getDirections: "దిశలు",
    printResult: "ట్రయేజ్ కార్డ్ ప్రింట్",
    replayAudio: "మళ్లీ వినండి",
    speaking: "మాట్లాడుతోంది…",
    messageDelivered: "సందేశం అందించబడింది",
    tapToHear: "ఫలితం వినడానికి ట్యాప్ చేయండి",
    callEmergency: "వెంటనే 1990 కి కాల్ చేయండి",
  },
  kannada: {
    ...en,
    title: "ತುರ್ತು ಆರೋಗ್ಯ ಟ್ರಯೇಜ್",
    subtitle: "ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ. ನಾವು ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತೇವೆ.",
    patientDetails: "ರೋಗಿ ಪ್ರವೇಶ",
    patientNameLabel: "ರೋಗಿಯ ಹೆಸರು",
    locationLabel: "ಸ್ಥಳ / ಗ್ರಾಮ",
    startBtn: "ಧ್ವನಿ ಟ್ರಯೇಜ್ ಪ್ರಾರಂಭ",
    stopBtn: "ನಿಲ್ಲಿಸಿ ವಿಶ್ಲೇಷಿಸಿ",
    listening: "ಕೇಳುತ್ತಿದ್ದೇವೆ…",
    saveCase: "ದಾಖಲೆಯಲ್ಲಿ ಉಳಿಸಿ",
    newTriage: "ಹೊಸ ಟ್ರಯೇಜ್",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    analyzing: "ಲಕ್ಷಣಗಳ ವಿಶ್ಲೇಷಣೆ…",
    clinicalSummary: "ವೈದ್ಯಕೀಯ ಸಾರಾಂಶ",
    immediateActions: "ತಕ್ಷಣದ ಕ್ರಮಗಳು",
    warningSigns: "ಎಚ್ಚರಿಕೆ ಲಕ್ಷಣಗಳು",
    doNotDo: "ಮಾಡಬೇಡಿ",
    emergencyContacts: "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    facilityTitle: "ಹತ್ತಿರದ ವೈದ್ಯಕೀಯ ಸೌಲಭ್ಯ",
    getDirections: "ದಿಕ್ಕುಗಳು",
    printResult: "ಟ್ರಯೇಜ್ ಕಾರ್ಡ್ ಮುದ್ರಣ",
    replayAudio: "ಮತ್ತೆ ಕೇಳಿ",
    speaking: "ಮಾತನಾಡುತ್ತಿದೆ…",
    messageDelivered: "ಸಂದೇಶ ನೀಡಲಾಗಿದೆ",
    tapToHear: "ಫಲಿತಾಂಶ ಕೇಳಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
    callEmergency: "ತಕ್ಷಣ 1990 ಗೆ ಕರೆ ಮಾಡಿ",
  },
  marathi: {
    ...en,
    title: "आपत्कालीन आरोग्य ट्रायज",
    subtitle: "स्पष्ट बोला. आम्ही तुमच्या लक्षणांचे मूल्यांकन करू.",
    patientDetails: "रुग्ण प्रवेश",
    patientNameLabel: "रुग्णाचे नाव",
    locationLabel: "स्थान / गाव",
    startBtn: "आवाज ट्रायज सुरू",
    stopBtn: "थांबवा आणि विश्लेषण",
    listening: "ऐकत आहोत…",
    saveCase: "रेकॉर्डमध्ये जतन",
    newTriage: "नवीन ट्रायज",
    dashboard: "डॅशबोर्ड",
    analyzing: "लक्षणांचे विश्लेषण…",
    clinicalSummary: "वैद्यकीय सारांश",
    immediateActions: "तात्काळ कृती",
    warningSigns: "इशारा चिन्हे",
    doNotDo: "करू नका",
    emergencyContacts: "आपत्कालीन संपर्क",
    facilityTitle: "जवळची वैद्यकीय सुविधा",
    getDirections: "दिशा",
    printResult: "ट्रायज कार्ड प्रिंट",
    replayAudio: "पुन्हा ऐका",
    speaking: "बोलत आहे…",
    messageDelivered: "संदेश दिला",
    tapToHear: "निकाल ऐकण्यासाठी टॅप करा",
    callEmergency: "ताबडतोब 1990 वर कॉल करा",
  },
};

export function getTranslations(lang: TranslationLanguage): TranslationKeys {
  return translations[lang] ?? translations.english;
}
