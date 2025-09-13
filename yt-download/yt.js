// 🎥 Get YouTube Video ID from URL
function getVideoId(url) {
  let regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  let match = url.match(regExp);
  return (match && match[2].length == 11) ? match[2] : null;
}

// 🎥 Preview Video in iframe
function loadVideo() {
  let url = document.getElementById("urlInput").value;
  let videoId = getVideoId(url);
  if (videoId) {
    let iframe = document.getElementById("videoFrame");
    iframe.src = "https://www.youtube.com/embed/" + videoId;
    document.getElementById("previewBox").style.display = "block";
  } else {
    alert("❌ Invalid YouTube URL!");
  }
}

// ⬇️ Download Video (Connected to Flask backend)
async function downloadVideo() {
  let url = document.getElementById("urlInput").value;
  let quality = document.getElementById("quality").value;

  if (!url) {
    alert("❌ Please enter a YouTube URL!");
    return;
  }

  try {
    // 🔗 Flask backend API call (Render URL डालो)
    let response = await fetch("https://tool-box-backend.onrender.com/api/download_youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url,
        user_id: "guest",                  // user id (optional)
        audio_only: (quality === "mp3")    // अगर mp3 चुना तो audio_only=true
      })
    });

    if (!response.ok) {
      let err = await response.json();
      alert("❌ Download failed: " + (err.error || "Unknown error"));
      return;
    }

    // response को blob में बदलना
    let blob = await response.blob();
    let fileName = (quality === "mp3") ? "audio.mp3" : "video.mp4";

    // डाउनलोड trigger करना
    let a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (e) {
    alert("❌ Error: " + e.message);
  }
}
