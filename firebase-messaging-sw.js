importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
    'messagingSenderId': '590817841198'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.data.title;
    const notificationOptions = {
        body: payload.data.detail,
        icon: payload.data.img || '/logo.png',
        vibrate: [100, 50, 100],
        data: payload.data.url
    };
    return self.registration.showNotification(notificationTitle,
        notificationOptions);
});

self.addEventListener(
  "notificationclick",
  function(event) {
    event.waitUntil(clients
      .matchAll({ type: "window" })
      .then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url == "/" && "focus" in client) return client.focus();
        }
        const openUrl = event.notification.data || '/';
        if (clients.openWindow) return clients.openWindow(openUrl);
      }));
    event.notification.close();
  },
  false
);
