# Install FFmpeg (for video file uploads)

FFmpeg is only needed when using **Upload Video** (files from your computer). YouTube URLs do not need it.

## Manual install (Windows)

1. Go to https://www.gyan.dev/ffmpeg/builds/  
2. Download **ffmpeg-release-essentials.zip**  
3. Extract and move the folder to `C:\ffmpeg` (you should have `C:\ffmpeg\bin\ffmpeg.exe`)  
4. Add `C:\ffmpeg\bin` to your system PATH (Environment Variables)  
5. Close and reopen your terminal  

Verify: `ffmpeg -version`

See main README.md for more troubleshooting.
