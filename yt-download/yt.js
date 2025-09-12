 function getVideoId(url) {
      let regExp=/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
      let match=url.match(regExp);
      return (match && match[2].length==11) ? match[2] : null;
    }

    function loadVideo(){
      let url=document.getElementById("urlInput").value;
      let videoId=getVideoId(url);
      if(videoId){
        let iframe=document.getElementById("videoFrame");
        iframe.src="https://www.youtube.com/embed/"+videoId;
        document.getElementById("previewBox").style.display="block";
      } else {
        alert("❌ Invalid YouTube URL!");
      }
    }

    function downloadVideo(){
      let quality=document.getElementById("quality").value;
      let url=document.getElementById("urlInput").value;
      alert("This is only UI Demo.\n\nURL: "+url+"\nQuality: "+quality+"\n👉 Connect backend (Node.js/Python) to enable real download.");
    }