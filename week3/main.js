let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;
let inputBoxDirectionX = Math.random() < 0.5 ? 1 : -1;
let inputBoxDirectionY = Math.random() < 0.5 ? 1 : -1;

let canvas;
let inputBox;
let images = [];
const url = "https://replicate-api-proxy.glitch.me/create_n_get/";
let collisionDetectionEnabled = false;

init();

function init() {
    loadSavedImages(); // 加载保存的图片
    initInterface();
    animate();
}

// Animate loop
function animate() {
    for (let imgObj of images) {
        if (!imgObj.isClicked) { // 只有未点击的图片会移动
            imgObj.x += imgObj.directionX * 2; 
            imgObj.y += imgObj.directionY * 2;

            imgObj.container.style.left = imgObj.x + 'px';
            imgObj.container.style.top = imgObj.y + 'px';

            if (imgObj.x < 0 || imgObj.x + imgObj.width > window.innerWidth) {
                imgObj.directionX *= -1; 
            }
            if (imgObj.y < 0 || imgObj.y + imgObj.height > window.innerHeight) {
                imgObj.directionY *= -1;
            }
        }
    }

    if (collisionDetectionEnabled) {
        for (let i = 0; i < images.length; i++) {
            for (let j = i + 1; j < images.length; j++) {
                if (!images[i].isClicked && !images[j].isClicked && checkCollision(images[i], images[j])) {
                    regenerateImages(i, j);
                }
            }
        }
    }

    requestAnimationFrame(animate);
}

function checkCollision(imgA, imgB) {
    return !(imgA.x > imgB.x + imgB.width || 
             imgA.x + imgA.width < imgB.x || 
             imgA.y > imgB.y + imgB.height || 
             imgA.y + imgA.height < imgB.y);
}

async function askPictures(prompt) {
    document.body.style.cursor = "progress";
    const data = {
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input: {
            prompt: prompt,
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };

    const picture_info = await fetch(url, options);
    const proxy_said = await picture_info.json();

    if (proxy_said.output.length == 0) {
        console.log("Something went wrong, try it again");
    } else {
        let img = document.createElement("img");
        img.src = proxy_said.output[0];
        img.style.width = '128px';
        img.style.height = '128px';
        img.style.borderRadius = '50%';
        img.style.position = 'absolute';

        let container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.overflow = 'hidden';
        container.style.width = '128px';
        container.style.height = '128px';
        container.style.borderRadius = '50%';
        container.style.clipPath = 'circle(50%)';
        container.appendChild(img);

        // Add click event listener to the image
        img.addEventListener('click', function() {
            img.style.width = '256px';
            img.style.height = '256px';
            container.style.width = '256px';
            container.style.height = '256px';
            container.style.clipPath = 'circle(128px)';
            images.forEach(imgObj => imgObj.isClicked = true); // 标记为已点击
            saveImageData(); // 保存已放大的图片
        });

        let x = Math.random() * (window.innerWidth - 128);
        let y = Math.random() * (window.innerHeight - 128);
        container.style.left = x + 'px';
        container.style.top = y + 'px';
        document.body.appendChild(container);
        
        // Store image info
        images.push({
            img,
            container,
            x,
            y,
            width: img.width,
            height: img.height,
            directionX: Math.random() < 0.5 ? 1 : -1,
            directionY: Math.random() < 0.5 ? 1 : -1,
            isClicked: false
        });
        
        if (images.length >= 2) {
            collisionDetectionEnabled = true;
        }
    }
    document.body.style.cursor = "auto";
}


function regenerateImages(indexA, indexB) {
    // 防止放大的图片被删除
    if (!images[indexA].isClicked && !images[indexB].isClicked) {
        document.body.removeChild(images[indexA].container);
        document.body.removeChild(images[indexB].container);
        images.splice(Math.max(indexA, indexB), 1);
        images.splice(Math.min(indexA, indexB), 1);

        askPictures("new prompt for image A");
        askPictures("new prompt for image B");
    }
}

// 保存图片数据
function saveImageData() {
    let savedImages = images
        .filter(imgObj => imgObj.isClicked) 
        .map(imgObj => ({
            src: imgObj.img.src,
            x: imgObj.x,
            y: imgObj.y,
            width: imgObj.img.style.width,
            height: imgObj.img.style.height
        }));
    localStorage.setItem('savedImages', JSON.stringify(savedImages));
}


function loadSavedImages() {
    let savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
    savedImages.forEach(imgData => {
        let img = document.createElement("img");
        img.src = imgData.src;
        img.style.width = imgData.width;
        img.style.height = imgData.height;
        img.style.borderRadius = '50%';
        img.style.position = 'absolute';

        let container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.overflow = 'hidden';
        container.style.width = imgData.width;
        container.style.height = imgData.height;
        container.style.borderRadius = '50%';
        container.style.clipPath = 'circle(50%)';
        container.appendChild(img);

        container.style.left = imgData.x + 'px';
        container.style.top = imgData.y + 'px';
        document.body.appendChild(container);

        images.push({
            img,
            container,
            x: imgData.x,
            y: imgData.y,
            width: parseInt(imgData.width),
            height: parseInt(imgData.height),
            directionX: 0,
            directionY: 0,
            isClicked: true
        });
    });
}

function initInterface() {
    document.body.style.backgroundColor = 'black';
    
    canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.style.position = 'absolute';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    document.body.appendChild(canvas);

    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'Keep Writing');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.zIndex = '100';
    inputBox.style.fontSize = '30px';
    inputBox.style.fontFamily = 'Arial';
    document.body.appendChild(inputBox);
    inputBox.setAttribute('autocomplete', 'off');

    inputBox.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            askPictures(inputValue);
        }
    });
}
