// To draw reactive and intercative audio waveforms ...
document.addEventListener('DOMContentLoaded', function () {
    const canvases = document.querySelectorAll('.waveform');
    const audioElements = document.querySelectorAll('audio');

    // Store audio buffer data globally for redrawing during playback
    const audioData = {};

    // Set up all waveforms
    canvases.forEach(canvas => {
        const audioSrc = canvas.getAttribute('data-audio');
        if (!audioSrc) return;

        // Find the corresponding audio element
        const audioElement = Array.from(audioElements).find(audio =>
            audio.querySelector('source').src.includes(audioSrc.split('/').pop())
        );

        if (audioElement) {
            // Connect the audio element to the canvas for playback updates
            audioElement.addEventListener('timeupdate', function () {
                if (audioData[audioSrc]) {
                    updateWaveform(canvas, audioData[audioSrc], audioElement);
                }
            });

            // Add click navigation on the waveform
            canvas.addEventListener('click', function (event) {
                // Calculate click position as percentage of canvas width
                const rect = canvas.getBoundingClientRect();
                const clickX = event.clientX - rect.left;
                const clickPercent = clickX / canvas.width;

                // Set audio playhead to that position
                audioElement.currentTime = clickPercent * audioElement.duration;

                // If audio is paused, start playing
                if (audioElement.paused) {
                    audioElement.play();
                }
            });

            // Add cursor style to indicate clickable area
            canvas.style.cursor = 'pointer';
        }

        // Load and decode the audio file
        fetch(audioSrc)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                return audioContext.decodeAudioData(arrayBuffer);
            })
            .then(audioBuffer => {
                // Store the audio data for this source
                audioData[audioSrc] = audioBuffer;
                // Draw initial waveform
                drawWaveform(canvas, audioBuffer);
            })
            .catch(e => console.error('Error loading audio for waveform:', e));
    });
});

// Function to draw the initial waveform
function drawWaveform(canvas, audioBuffer) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get audio data
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);

    ctx.fillStyle = '#4444'; // Background color for non-played portion

    for (let i = 0; i < width; i++) {
        const dataIndex = Math.floor(i * step);
        let max = 0;

        // Find the max value in this segment
        for (let j = 0; j < step && (dataIndex + j) < data.length; j++) {
            const value = Math.abs(data[dataIndex + j]);
            if (value > max) max = value;
        }

        // Draw bar
        const barHeight = max * height;
        const y = (height - barHeight) / 2;
        ctx.fillRect(i, y, 1, barHeight);
    }
}

// Function to update waveform during playback
function updateWaveform(canvas, audioBuffer, audioElement) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Calculate playback progress
    const progress = audioElement.currentTime / audioElement.duration;
    const progressWidth = Math.floor(width * progress);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get audio data
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);

    // Draw non-played portion
    ctx.fillStyle = '#4444';
    for (let i = progressWidth; i < width; i++) {
        const dataIndex = Math.floor(i * step);
        let max = 0;

        for (let j = 0; j < step && (dataIndex + j) < data.length; j++) {
            const value = Math.abs(data[dataIndex + j]);
            if (value > max) max = value;
        }

        const barHeight = max * height;
        const y = (height - barHeight) / 2;
        ctx.fillRect(i, y, 1, barHeight);
    }

    // Draw played portion
    ctx.fillStyle = '#444';
    for (let i = 0; i < progressWidth; i++) {
        const dataIndex = Math.floor(i * step);
        let max = 0;

        for (let j = 0; j < step && (dataIndex + j) < data.length; j++) {
            const value = Math.abs(data[dataIndex + j]);
            if (value > max) max = value;
        }

        const barHeight = max * height;
        const y = (height - barHeight) / 2;
        ctx.fillRect(i, y, 1, barHeight);
    }
}