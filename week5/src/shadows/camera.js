const subtitles = document.querySelectorAll('.subtitle');
let currentIndex = 0;
const duration = 15000; // 15 seconds

function showNextSubtitle() {
    // Hide current subtitle
    subtitles[currentIndex].classList.remove('active');
    
    // Move to the next subtitle
    currentIndex = (currentIndex + 1) % subtitles.length;
    
    // Show next subtitle
    subtitles[currentIndex].classList.add('active');
}

// Set interval to change subtitle every 15 seconds
setInterval(showNextSubtitle, duration);


// camera.js

const video = document.createElement("video");
const canvas = document.createElement("canvas");
canvas.width = 320; 
canvas.height = 240; 
document.body.appendChild(video); // 可选，是否显示视频流
document.body.appendChild(canvas); // 可选，是否显示 canvas


function enableCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => console.error("摄像头无法访问: ", err));
}

function captureAndIdentifyColor() {
  const ctx = canvas.getContext("2d");
  
  // 将视频流绘制到 canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // 获取 canvas 像素数据
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // 计算主颜色，简单方法：取图片的平均颜色
  let r = 0, g = 0, b = 0;
  let count = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
    count++;
  }
  
  // 计算平均颜色
  r = Math.floor(r / count);
  g = Math.floor(g / count);
  b = Math.floor(b / count);
  
  // 返回主颜色的字符串表示形式
  return `rgb(${r},${g},${b})`;
}


// 导出函数供其他文件调用
export { enableCamera, captureAndIdentifyColor };
