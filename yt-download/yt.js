const BACKEND_URL = "https://tool-box-backend.onrender.com";

        // Format option selection
        document.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                option.querySelector('input').checked = true;
            });
        });

        // Paste from clipboard
        async function pasteFromClipboard() {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('urlInput').value = text;
                if (text.includes('youtube.com') || text.includes('youtu.be')) {
                    showStatus("✅ YouTube URL detected! Click Download Now to proceed.", "success");
                }
            } catch (err) {
                showStatus("⚠️ Please paste the URL manually (clipboard access denied)", "warning");
            }
        }

        // Show status messages
        function showStatus(message, type = "info") {
            const statusDiv = document.getElementById("status");
            statusDiv.className = `status status-${type}`;
            statusDiv.textContent = message;
            statusDiv.style.display = "block";
            
            if (type === "success" || type === "info") {
                setTimeout(() => {
                    statusDiv.style.display = "none";
                }, 6000);
            }
        }

        // Update progress
        function updateProgress(percent, message = "") {
            const container = document.getElementById("progressContainer");
            const fill = document.getElementById("progressFill");
            const text = document.getElementById("progressText");
            
            if (percent > 0) {
                container.style.display = "block";
                fill.style.width = percent + "%";
                text.textContent = message || `Processing... ${percent}%`;
            } else {
                container.style.display = "none";
                fill.style.width = "0%";
            }
        }

        // Format helper functions
        function formatDuration(seconds) {
            if (!seconds) return 'Unknown';
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (hours > 0) {
                return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        function formatNumber(num) {
            if (!num) return 'Unknown';
            return num.toLocaleString();
        }

        function formatDate(dateStr) {
            if (!dateStr) return 'Unknown';
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            return `${day}/${month}/${year}`;
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Extract video ID from URL
        function getVideoId(url) {
            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }

        // Display video preview
        function displayVideoPreview(info) {
            const preview = document.getElementById("videoPreview");
            const thumbnail = document.getElementById("videoThumbnail");
            const title = document.getElementById("videoTitle");
            const uploader = document.getElementById("videoUploader");
            const duration = document.getElementById("videoDuration");
            const views = document.getElementById("videoViews");
            const date = document.getElementById("videoDate");

            if (info.thumbnail) {
                thumbnail.src = info.thumbnail;
                thumbnail.style.display = "block";
            } else {
                thumbnail.style.display = "none";
            }

            title.textContent = info.title || 'Unknown Title';
            uploader.textContent = info.uploader || 'Unknown Channel';
            duration.textContent = formatDuration(info.duration);
            views.textContent = formatNumber(info.view_count);
            date.textContent = formatDate(info.upload_date);

            preview.style.display = "block";
        }

        // Check video URL
        async function checkVideo(url) {
            try {
                showStatus("🔍 Checking video availability...", "info");
                updateProgress(20, "Validating URL...");
                
                const response = await fetch(`${BACKEND_URL}/api/check_url`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url })
                });

                const result = await response.json();
                updateProgress(0);

                if (response.ok && result.valid) {
                    showStatus(`✅ Video found: "${result.title}"`, "success");
                    displayVideoPreview(result);
                    return true;
                } else {
                    showStatus(`❌ ${result.error || 'Video not accessible'}`, "error");
                    if (result.suggestion) {
                        setTimeout(() => {
                            showStatus(`💡 Suggestion: ${result.suggestion}`, "info");
                        }, 2000);
                    }
                    return false;
                }
            } catch (error) {
                updateProgress(0);
                showStatus(`❌ Connection error: ${error.message}`, "error");
                return false;
            }
        }

        // Download video
        async function downloadVideo(url, audioOnly) {
            try {
                updateProgress(30, "Preparing download...");
                
                const response = await fetch(`${BACKEND_URL}/api/download_youtube`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/octet-stream"
                    },
                    body: JSON.stringify({
                        url: url,
                        user_id: "web_user",
                        audio_only: audioOnly
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                }

                updateProgress(60, "Downloading file...");

                // Get filename from response headers
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = audioOnly ? "audio.mp3" : "video.mp4";
                
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch) {
                        filename = decodeURIComponent(filenameMatch[1]);
                    }
                }

                updateProgress(80, "Processing download...");

                // Convert to blob and download
                const blob = await response.blob();
                
                if (blob.size === 0) {
                    throw new Error("Downloaded file is empty");
                }

                updateProgress(95, "Finalizing...");

                // Create download link
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();

                // Cleanup
                setTimeout(() => {
                    window.URL.revokeObjectURL(downloadUrl);
                }, 100);

                updateProgress(100, "Download completed!");
                showStatus(`✅ Download completed: ${filename} (${formatFileSize(blob.size)})`, "success");
                
                setTimeout(() => updateProgress(0), 2000);
                
                return true;

            } catch (error) {
                updateProgress(0);
                
                let errorMessage = error.message;
                let suggestion = "";

                // Provide user-friendly error messages
                if (errorMessage.includes("Failed to fetch")) {
                    errorMessage = "Cannot connect to download server";
                    suggestion = "Please check your internet connection and try again";
                } else if (errorMessage.includes("private") || errorMessage.includes("unavailable")) {
                    errorMessage = "This video is private or unavailable";
                    suggestion = "Try downloading a different public video";
                } else if (errorMessage.includes("copyright") || errorMessage.includes("blocked")) {
                    errorMessage = "This video is protected by copyright";
                    suggestion = "The video owner has restricted downloads";
                } else if (errorMessage.includes("age") || errorMessage.includes("restricted")) {
                    errorMessage = "Age-restricted content cannot be downloaded";
                    suggestion = "This video has age verification requirements";
                }

                showStatus(`❌ Download failed: ${errorMessage}`, "error");
                
                if (suggestion) {
                    setTimeout(() => {
                        showStatus(`💡 ${suggestion}`, "info");
                    }, 2000);
                }

                return false;
            }
        }

        // Main process function
        async function processVideo() {
            const url = document.getElementById("urlInput").value.trim();
            const selectedFormat = document.querySelector('input[name="format"]:checked').value;
            const downloadBtn = document.getElementById("downloadBtn");

            // Validation
            if (!url) {
                showStatus("❌ Please enter a YouTube URL", "error");
                return;
            }

            if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
                showStatus("❌ Please enter a valid YouTube URL", "error");
                return;
            }

            // Disable button during process
            downloadBtn.disabled = true;
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = "⏳ Processing...";

            try {
                // Step 1: Check video
                const isValidVideo = await checkVideo(url);
                if (!isValidVideo) {
                    return;
                }

                // Step 2: Download video
                const audioOnly = selectedFormat === "mp3";
                showStatus(`🚀 Starting ${audioOnly ? 'audio' : 'video'} download...`, "info");
                
                await downloadVideo(url, audioOnly);

            } catch (error) {
                showStatus(`❌ Unexpected error: ${error.message}`, "error");
                console.error("Process error:", error);
            } finally {
                // Re-enable button
                downloadBtn.disabled = false;
                downloadBtn.textContent = originalText;
            }
        }

        // Auto-check video when URL is pasted
        let checkTimeout;
        document.getElementById("urlInput").addEventListener("input", function(e) {
            const url = e.target.value.trim();
            
            // Clear previous timeout
            clearTimeout(checkTimeout);
            
            // Hide preview if URL is cleared
            if (!url) {
                document.getElementById("videoPreview").style.display = "none";
                return;
            }
            
            // Auto-check after user stops typing (debounce)
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                checkTimeout = setTimeout(() => {
                    checkVideo(url);
                }, 1000);
            }
        });

        // Handle Enter key
        document.getElementById("urlInput").addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                processVideo();
            }
        });

        // Test backend connection on load
        async function testConnection() {
            try {
                const response = await fetch(`${BACKEND_URL}/api/health`);
                if (response.ok) {
                    const data = await response.json();
                    console.log("✅ Backend connected:", data);
                } else {
                    console.warn("⚠️ Backend health check failed");
                }
            } catch (error) {
                console.error("❌ Backend connection failed:", error);
                showStatus("⚠️ Server connection issue. Some features may be limited.", "warning");
            }
        }

        // Initialize app
        document.addEventListener("DOMContentLoaded", function() {
            testConnection();
            showStatus("🎉 Ready! Paste a YouTube URL to get started.", "info");
        });