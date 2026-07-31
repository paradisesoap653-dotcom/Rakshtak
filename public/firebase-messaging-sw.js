importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyA3JahikJAKwhmcQ8_Nu9ZZvkZN1t891fs",
  authDomain: "rakshtak-b08e7.firebaseapp.com",
  projectId: "rakshtak-b08e7",
  storageBucket: "rakshtak-b08e7.firebasestorage.app",
  messagingSenderId: "553278409750",
  appId: "1:553278409750:web:3be527656ab7a2636e7937",
  measurementId: "G-XJ4GRK40PZ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || '🛺 طلب مشوار جديد!';
  const notificationOptions = {
    body: payload.notification?.body || 'هناك زبون جديد طلب مشواراً، افتح التطبيق للقبول بسرعة!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [300, 100, 300, 100, 300]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
