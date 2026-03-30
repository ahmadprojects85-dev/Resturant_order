// Placeholder for notification sound
// In production, replace with actual audio file
// For now, we'll use Web Audio API to generate a pleasant notification tone
// Play notification sound 3 times
export function playNotificationSound() {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        return;
    }
    try {
        const playOnce = (delay = 0) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a pleasant two-tone notification
            const playTone = (frequency, startTime, duration) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };

            const now = audioContext.currentTime + delay;
            playTone(800, now, 0.15);
            playTone(1000, now + 0.15, 0.15);
        };

        // Ring 3 times
        playOnce(0);
        playOnce(0.8);
        playOnce(1.6);

    } catch (error) {
        console.error('Failed to play notification sound:', error);
    }
}
// Ringing sound for waiter calls
export function playRingSound(existingContext = null) {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        return;
    }
    try {
        const audioContext = existingContext || new (window.AudioContext || window.webkitAudioContext)();

        const ringOnce = (startTime) => {
            const frequencies = [660, 880]; // Classic dual-tone ring
            frequencies.forEach(f => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.type = 'triangle';
                oscillator.frequency.value = f;

                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                gainNode.gain.linearRampToValueAtTime(0, startTime + 0.4);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.4);
            });
        };

        // Standard double ring pattern
        const now = audioContext.currentTime;
        ringOnce(now);
        ringOnce(now + 0.5);
        ringOnce(now + 1.2);
        ringOnce(now + 1.7);

    } catch (error) {
        console.error('Failed to play ring sound:', error);
    }
}
