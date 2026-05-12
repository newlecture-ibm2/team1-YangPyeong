self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const notificationTitle = data.notification?.title || data.data?.title || 'FarmBalance';
    const notificationOptions = {
      body: data.notification?.body || data.data?.body || '',
      icon: '/logo.png', // public 폴더의 로고
      data: {
        link: data.data?.link || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // 이미 열려 있는 탭이 있다면 거기로 포커스
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === link && 'focus' in client) {
          return client.focus();
        }
      }
      // 열려 있는 탭이 없다면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
