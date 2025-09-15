 // 🌐 Backend URL
        const BACKEND_URL = "https://tool-box-backend.onrender.com";

        // 🍪 Cookie management
        let cookieId = localStorage.getItem('ytd_cookie_id');
        
        // Update delete button visibility on load
        if (cookieId) {
            document.getElementById('deleteCookieBtn').style.display = 'inline-flex';
            showStatus("🍪 Using saved authentication cookies", "info");
        }

        // 🎥 Get YouTube Video ID from URL
        function getVideoId(url) {
            let regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
            let match = url.match(regExp);
            return (match && match[2].length == 11) ? match[2] : null;
        }

        // 🎥 Preview Video in iframe
        function loadVideo() {
            let url = document.getElementById("urlInput").value.trim();
            if (!url) {
                alert("❌ Please enter a YouTube URL!");
                return;
            }

            let videoId = getVideoId(url);
            if (videoId) {
                let iframe = document.getElementById("videoFrame");
                iframe.src = "https://www.youtube.com/embed/" + videoId;
                document.getElementById("previewBox").style.display = "block";
                
                // Check URL validity with backend
                checkVideoUrl(url);
            } else {
                alert("❌ Invalid YouTube URL! Please check the link.");
            }
        }

        // 🔍 Check Video URL before downloading
        async function checkVideoUrl(url) {
            try {
                showStatus("🔍 Checking video availability...", "info");
                
                let response = await fetch(`${BACKEND_URL}/api/check_url`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: url,
                        cookie_id: cookieId,
                        user_id: "web_user"
                    })
                });
                
                let result = await response.json();
                
                if (result.valid) {
                    showStatus(`✅ Video found: ${result.title}`, "success");
                    displayVideoInfo(result);
                    hideCookieUpload();
                } else if (result.needs_cookies) {
                    showStatus("🔐 This video requires authentication. Please upload cookies.", "warning");
                    showCookieUpload();
                } else {
                    showStatus(`❌ Error: ${result.error}`, "error");
                }
            } catch (e) {
                showStatus(`❌ Error checking video: ${e.message}`, "error");
            }
        }

        // 📊 Display video information
        function displayVideoInfo(info) {
            let infoDiv = document.getElementById("videoInfo");
            
            infoDiv.innerHTML = `
                <h3>📺 ${info.title}</h3>
                <p><strong>👤 Channel:</strong> ${info.uploader || 'Unknown'}</p>
                <p><strong>⏱️ Duration:</strong> ${formatDuration(info.duration)}</p>
                <p><strong>👀 Views:</strong> ${formatNumber(info.view_count)}</p>
                <p><strong>📅 Upload Date:</strong> ${formatDate(info.upload_date)}</p>
            `;
            infoDiv.style.display = "block";
        }

        // 🔧 Helper functions for formatting
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

        // 🍪 Show/hide cookie upload section
        function showCookieUpload() {
            document.getElementById("cookieUpload").style.display = "block";
        }

        function hideCookieUpload() {
            document.getElementById("cookieUpload").style.display = "none";
        }

        // 📤 Upload cookies
        async function uploadCookies() {
            const fileInput = document.getElementById("cookieFile");
            const file = fileInput.files[0];
            
            if (!file) {
                alert("❌ Please select a cookies.txt file!");
                return;
            }
            
            if (!file.name.endsWith('.txt')) {
                alert("❌ Please upload a .txt file!");
                return;
            }
            
            try {
                showStatus("📤 Uploading cookies...", "info");
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('user_id', 'web_user');
                
                const response = await fetch(`${BACKEND_URL}/api/upload_cookies`, {
                    method: "POST",
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    cookieId = result.cookie_id;
                    localStorage.setItem('ytd_cookie_id', cookieId);
                    showStatus("✅ Cookies uploaded successfully!", "success");
                    document.getElementById('deleteCookieBtn').style.display = 'inline-flex';
                    hideCookieUpload();
                    
                    // Re-check the current URL
                    const url = document.getElementById("urlInput").value.trim();
                    if (url) checkVideoUrl(url);
                } else {
                    showStatus(`❌ Cookie upload failed: ${result.error}`, "error");
                }
            } catch (e) {
                showStatus(`❌ Error uploading cookies: ${e.message}`, "error");
            }
        }

        // 🗑️ Delete cookies
        async function deleteCookies() {
            if (!cookieId) return;
            
            try {
                showStatus("🗑️ Deleting cookies...", "info");
                
                const response = await fetch(`${BACKEND_URL}/api/delete_cookie`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cookie_id: cookieId,
                        user_id: "web_user"
                    })
                });
                
                if (response.ok) {
                    cookieId = null;
                    localStorage.removeItem('ytd_cookie_id');
                    showStatus("✅ Cookies deleted successfully!", "success");
                    document.getElementById('deleteCookieBtn').style.display = 'none';
                    hideCookieUpload();
                }
            } catch (e) {
                showStatus(`❌ Error deleting cookies: ${e.message}`, "error");
            }
        }

        // ❓ Show cookie instructions
        function showCookieInstructions() {
            const instructions = `
🍪 How to Get cookies.txt File:

🌐 Chrome Browser:
1. Open Chrome and go to youtube.com
2. Login to your account  
3. Install "cookies.txt" extension from Chrome Web Store
4. Click the extension icon → Export → Save as .txt file
5. Upload that file here

🦊 Firefox Browser:
1. Go to youtube.com and login
2. Install "cookies.txt" add-on
3. Click add-on icon → Export cookies
4. Save and upload the .txt file

🔧 Manual Method:
1. Press F12 → Application tab → Cookies → https://youtube.com
2. Copy cookie data to a .txt file in Netscape format
3. Upload here

⚠️ Note: Cookies contain your login information, keep them secure!
            `;
            
            alert(instructions);
        }

        // 📱 Show status messages
        function showStatus(message, type = "info") {
            let statusDiv = document.getElementById("status");
            
            statusDiv.className = `status status-${type}`;
            statusDiv.textContent = message;
            statusDiv.style.display = "block";
            
            // Auto-hide success/info messages after 5 seconds
            if (type === "success" || type === "info") {
                setTimeout(() => {
                    statusDiv.style.display = "none";
                }, 5000);
            }
        }

        // 📊 Update progress bar
        function updateProgress(percent) {
            const progressBar = document.getElementById("progressBar");
            const progressFill = document.getElementById("progressFill");
            
            if (percent > 0) {
                progressBar.style.display = "block";
                progressFill.style.width = percent + "%";
            } else {
                progressBar.style.display = "none";
                progressFill.style.width = "0%";
            }
        }

        // ⬇️ Download Video (Enhanced version)
        async function downloadVideo() {
            let url = document.getElementById("urlInput").value.trim();
            let quality = document.getElementById("quality").value;
            
            if (!url) {
                alert("❌ Please enter a YouTube URL!");
                return;
            }
            
            // Get download button and disable it
            const downloadBtn = event.target;
            const originalText = downloadBtn.textContent;
            downloadBtn.disabled = true;
            downloadBtn.textContent = "⏳ Processing...";
            
            try {
                showStatus("🚀 Preparing download...", "info");
                updateProgress(10);
                
                // Make API call to backend
                let response = await fetch(`${BACKEND_URL}/api/download_youtube`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: url,
                        user_id: "web_user",
                        cookie_id: cookieId,
                        audio_only: (quality === "mp3")
                    })
                });
                
                updateProgress(30);
                
                if (!response.ok) {
                    let err = await response.json();
                    
                    if (err.needs_cookies) {
                        showStatus("🔐 Authentication required. Please upload cookies.", "warning");
                        showCookieUpload();
                    } else {
                        showStatus(`❌ Download failed: ${err.error}`, "error");
                    }
                    updateProgress(0);
                    return;
                }
                
                showStatus("📦 Downloading file...", "info");
                updateProgress(60);
                
                // Get filename from response headers
                const contentDisposition = response.headers.get('Content-Disposition');
                let fileName = "download";
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch) {
                        fileName = filenameMatch[1];
                    }
                } else {
                    fileName = (quality === "mp3") ? "audio.mp3" : "video.mp4";
                }
                
                updateProgress(80);
                
                // Convert response to blob and trigger download
                let blob = await response.blob();
                
                updateProgress(95);
                
                let a = document.createElement("a");
                a.href = window.URL.createObjectURL(blob);
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                
                // Clean up blob URL
                window.URL.revokeObjectURL(a.href);
                
                updateProgress(100);
                showStatus(`✅ Download completed: ${fileName}`, "success");
                
                setTimeout(() => updateProgress(0), 2000);
                
            } catch (e) {
                showStatus(`❌ Error: ${e.message}`, "error");
                updateProgress(0);
                console.error('Download error:', e);
            } finally {
                // Re-enable download button
                downloadBtn.disabled = false;
                downloadBtn.textContent = originalText;
            }
        }

        // 🎯 Handle Enter key in URL input
        document.getElementById('urlInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadVideo();
            }
        });

        // 📁 Handle file input change
        document.getElementById('cookieFile').addEventListener('change', function(e) {
            const fileName = e.target.files[0]?.name || 'Choose cookies.txt file';
            document.querySelector('.file-input-button').textContent = `📁 ${fileName}`;
        });