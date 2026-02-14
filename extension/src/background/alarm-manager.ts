import { getReviewsDue } from '../db/operations';

const REVIEW_CHECK_ALARM = 'check-reviews';

// Set up alarms on extension install/startup
export function setupAlarms(): void {
  // Check for due reviews every hour
  chrome.alarms.create(REVIEW_CHECK_ALARM, {
    periodInMinutes: 60,
  });

  console.log('Alarm manager: Set up alarm for review check');
}

// Handle alarm events
export async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (alarm.name === REVIEW_CHECK_ALARM) {
    await checkAndNotifyReviews();
  }
}

async function checkAndNotifyReviews(): Promise<void> {
  try {
    const reviews = await getReviewsDue();
    const now = Date.now();
    const dueNow = reviews.filter(r => r.sr.nextReview <= now);

    if (dueNow.length > 0) {
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Cortex Lattice',
        message: `${dueNow.length} problem${dueNow.length > 1 ? 's' : ''} ready for review!`,
        priority: 2,
        buttons: [
          { title: 'Review Now' },
        ],
      });

      // Update badge
      chrome.action.setBadgeText({ text: String(dueNow.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    } else {
      // Clear badge if no reviews due
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error checking reviews:', error);
  }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked?.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Open dashboard
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/components/dashboard/index.html'),
    });
  }
  chrome.notifications.clear(notificationId);
});
