const notificationAudio = new Audio("/sounds/Bell.mp3");

export function playNotification() {
  notificationAudio.currentTime = 0;

  notificationAudio.play().catch((err) => {
    console.log("Unable to play notification sound:", err);
  });
}