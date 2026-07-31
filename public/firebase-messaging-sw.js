importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyReplaceIfNeeded",
  authDomain: "rakshtak-b08e7.firebaseapp.com",
  projectId: "rakshtak-b08e7",
  storageBucket: "rakshtak-b08e7.appspot.com",
  messagingSenderId: "553278409750",
  appId: "1:553278409750:web:3be527656ab7a2636e7937"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'طلب مشوار جديد 🛺';
  const notificationOptions = {
    body: payload.notification?.body || 'هناك زبون يطلب مشواراً الآن، افتح التطبيق للقبول!',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
