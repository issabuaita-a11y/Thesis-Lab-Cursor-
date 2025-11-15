# BPM-Reactive Music Player with Hand Tracking

An interactive web-based music player that analyzes audio in real-time to detect BPM and uses hand tracking to create an immersive animated background experience where visual effects follow and respond to hand movements.

## Features

- **Real-time BPM Detection**: Automatically detects beats per minute from audio files
- **Hand Tracking**: Uses MediaPipe Hands to track hand movements via webcam
- **Dynamic Background**: Color gradients and opacity change based on BPM and hand position
- **Particle System**: Animated particles that react to BPM and are attracted to hand positions
- **Audio Visualization**: Real-time waveform and frequency bar displays
- **Interactive Experience**: "Conduct" the visual effects with your hands

## Setup

1. **Clone or download** this project to your local machine

2. **Serve the files** using a local web server (required for MediaPipe and audio file access):
   
   Using Python 3:
   ```bash
   python -m http.server 8000
   ```
   
   Using Node.js (http-server):
   ```bash
   npx http-server -p 8000
   ```
   
   Using PHP:
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**: Navigate to `http://localhost:8000`

## Usage

1. **Grant camera permissions** when prompted (required for hand tracking)

2. **Load an audio file**:
   - Click "Choose Audio File" button
   - Select an audio file from your computer (MP3, WAV, etc.)

3. **Play the music**:
   - Click the "Play" button
   - The BPM will be detected automatically

4. **Interact with your hands**:
   - Position your hands in front of the camera
   - Move your hands to see the background and particles follow
   - The visual effects will respond to both BPM and hand position

## Controls

- **Play/Pause Button**: Start or stop audio playback
- **Volume Slider**: Adjust audio volume
- **File Input**: Load audio files from your computer

## Technical Details

### Technologies Used

- **Web Audio API**: For audio analysis and frequency data
- **MediaPipe Hands**: For real-time hand tracking
- **Canvas API**: For particle system and audio visualizations
- **CSS3 Animations**: For smooth background transitions

### Components

- **AudioAnalyzer**: Handles audio loading and frequency analysis
- **BPMDetector**: Implements beat detection algorithm
- **HandTracker**: Manages webcam access and hand position tracking
- **BackgroundAnimator**: Controls color gradients and opacity based on BPM and hands
- **ParticleSystem**: Creates and animates particles with physics
- **AudioVisualizer**: Renders waveform and frequency displays

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (may have limited MediaPipe support)

**Note**: HTTPS or localhost is required for camera access in most browsers.

## Troubleshooting

- **Camera not working**: Ensure you've granted camera permissions and are using HTTPS or localhost
- **Audio not playing**: Check browser console for CORS errors, ensure you're using a local server
- **BPM not detected**: Try a different audio file with clear beats
- **Hands not tracked**: Ensure good lighting and your hands are visible to the camera

## License

This project is open source and available for educational purposes.

