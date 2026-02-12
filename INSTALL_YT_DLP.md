# Install yt-dlp (for YouTube URLs)

yt-dlp is **only needed for YouTube links**. Uploading a video from your computer does not use it.

## Install

1. Open https://github.com/yt-dlp/yt-dlp/releases  
2. Download **yt-dlp.exe** from the latest release  
3. Create a `bin` folder in the project root  
4. Put **yt-dlp.exe** inside that `bin` folder  

The app looks for `bin/yt-dlp.exe` in the project and uses it automatically.

Then restart your backend (`npm run dev`) and try a YouTube URL.
