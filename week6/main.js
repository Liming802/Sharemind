import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

let others = {};
let me;
let myKey;
let db;
let app;
const replicateProxy = "https://replicate-api-proxy.glitch.me";
let exampleName = "2DImageEmbeddingDistancesNoAuth";
let user = prompt("Please enter your name", "Ming"); //cheap auth
initFirebase();




function renderOthers() {
    if (!me) return;
    
    // 清除之前的线条和标签
    let existingLines = document.getElementsByClassName('connectionLine');
    while (existingLines.length > 0) {
        existingLines[0].parentNode.removeChild(existingLines[0]);
    }

    getNormalized2DDistance(me, others);
    let angle = 0;
    let angleStep = 2 * Math.PI / (Object.keys(others).length + 1);
    
    // 获取画布或创建画布
    let canvas = document.getElementById("canvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.style.position = "absolute";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
    }
    
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空之前的线条
    
    // 获取中心点坐标
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let key in others) {
        let other = others[key];
        let otherDiv = document.getElementById(key);
        if (!otherDiv) {
            otherDiv = document.createElement("div");
            otherDiv.setAttribute("id", key);
            document.body.appendChild(otherDiv);
        }
        
        // 计算图片的位置和距离
        let distance = 200 + (1 - other.normalizedDistance) * 200;
        let x = distance * Math.cos(angle);
        let y = distance * Math.sin(angle);
        angle += angleStep;

        otherDiv.style.position = "absolute";
        otherDiv.style.left = (centerX + x) + "px";
        otherDiv.style.top = (centerY + y) + "px";
        otherDiv.style.transform = "translate(-50%,-50%)";
        
     
        let otherImage = document.createElement("img");
        otherImage.src = other.base64;
        otherDiv.innerHTML = "";
        otherDiv.appendChild(otherImage);
        let otherName = document.createElement("p");
        otherName.innerHTML = other.userName;
        otherName.style.zIndex = 100;
        otherName.style.position = "absolute";
        otherName.style.top = 0;
        otherName.style.left = 0;
        otherName.style.color = "black";
        otherDiv.appendChild(otherName);
        
        let otherPrompt = document.createElement("p");
        otherPrompt.style.fontSize = 10 + 20 * (other.normalizedDistance) + "px";
        otherPrompt.style.color = "black";
        otherPrompt.style.zIndex = 100;
        otherPrompt.style.position = "absolute";
        otherPrompt.style.top = 20;
        otherPrompt.style.left = 0;
        otherPrompt.innerHTML = other.prompt;
        otherDiv.appendChild(otherPrompt);

        otherImage.style.width = 100 + 100 * (other.normalizedDistance) + "px";
        otherImage.style.height = 100 + 100 * (other.normalizedDistance) + "px";
        

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + x, centerY + y);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
        
       
        let lineDistance = Math.sqrt(x * x + y * y);
        let percentageDistance = Math.round((other.normalizedDistance * 1000)) + "%";
        let anotherDistance =  Math.round((other.distance * 100)) + "%";
        ctx.fillStyle = "black";
        ctx.font = "18px Arial";
        ctx.fillText(percentageDistance + anotherDistance , (centerX + x + centerX) / 2, (centerY + y + centerY) / 2);
    }
}

function getNormalized2DDistance(me, others) {

    let maxDistance = 0;
    let minDistance = 10000000;
    for (let key in others) {
        let other = others[key];
        console.log("me", me, other);
        other.distance = cosineSimilarity(me.imageEmbedding, other.imageEmbedding);
        console.log("distance", other.distance);
        if (other.distance > maxDistance) maxDistance = other.distance;
        if (other.distance < minDistance) minDistance = other.distance;
    }
    for (let key in others) {
        let other = others[key];
        other.normalizedDistance = (other.distance - minDistance) / (maxDistance - minDistance);
        console.log("normalizedDistance", other.normalizedDistance);
    }
}

function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += (a[i] * b[i]);
        magnitudeA += (a[i] * a[i]);
        magnitudeB += (b[i] * b[i]);
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    return dotProduct / (magnitudeA * magnitudeB);
}



let inputField = document.getElementById("inputText");
inputField.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForPicture(inputField.value);
    }
});


async function askForImageEmbedding(prompt, base64) {
    let justBase64 = base64.split(",")[1];
    const data = {
        "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
        "fieldToConvertBase64ToURL": "input",
        "fileFormat": "png",
        // "version": "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        "input": {
            "input": justBase64,
            "modality": "vision"
        },
    };


    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    document.body.style.cursor = "progress";
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const replicateJSON = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("replicateJSON", replicateJSON);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        console.log("image embedding", replicateJSON.output);
        feedback.innerHTML = "";
        console.log("embedding", replicateJSON.output);

        console.log("user", user);

        setDataInFirebase(exampleName, { userName: user, prompt: prompt, base64: base64, imageEmbedding: replicateJSON.output });
    }
}



async function askForPicture(prompt) {
    // 强制将 prompt 变成一个人像相关的提示
    const personPrompt = `A portrait of a person based on this description: ${prompt}`;
    
    const data = {
        "version": "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        input: {
            prompt: personPrompt,
            seed: 42
        },
    };

    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    document.body.style.cursor = "progress";
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const replicateJSON = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("replicateJSON", replicateJSON);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        feedback.innerHTML = "";
        let imageURL = replicateJSON.output[0];
        let localImage = document.getElementById("outputImage");
        localImage.crossOrigin = "Anonymous";
        localImage.onload = function () {
            console.log("image loaded", localImage);
            let canvas = document.createElement("canvas");
            canvas.width = localImage.width;
            canvas.height = localImage.height;
            let context = canvas.getContext("2d");
            context.drawImage(localImage, 0, 0, localImage.width, localImage.height);
            let base64 = canvas.toDataURL();
            askForImageEmbedding(prompt, base64);
        }
        localImage.src = imageURL;
    }
}


//////////////FIREBASE/////////



function initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyBRA7oN1C9Cm0CKCVys0WUzl_7umMIYdiA",
        authDomain: "shared-mind.firebaseapp.com",
        databaseURL: "https://shared-mind-default-rtdb.firebaseio.com",
        projectId: "shared-mind",
        storageBucket: "shared-mind.appspot.com",
        messagingSenderId: "1050804828540",
        appId: "1:1050804828540:web:b88433b3bf02b9361c4cf9",
        measurementId: "G-YJC9GF5V87"
    };
    app = initializeApp(firebaseConfig);
    //make a folder in your firebase for this example
    db = getDatabase();
    const usersRef = ref(db, exampleName + '/');
    onValue(usersRef, (snapshot) => {
        let users = snapshot.val();
        for (let key in users) {
            if (users[key].userName === user) {
                me = users[key];
                myKey = key;
                renderOthers();
                break;
            }
        }
    });
    subscribeToData(exampleName);
}


function subscribeToData(folder, callback) {
    //get callbacks when there are changes either by you locally or others remotely
    const commentsRef = ref(db, folder + '/');
    onChildAdded(commentsRef, (FBdata) => {
        let data = FBdata.val();
        let key = FBdata.key;
        if (key == myKey) {
            document.getElementById("inputText").value = data.prompt;
            let localImage = document.getElementById("outputImage");
            localImage.src = data.base64;
            me = data;
            renderOthers();
        } else {
            others[key] = data;
            renderOthers();
        };
    });
    onChildChanged(commentsRef, (FBdata) => {
        let data = FBdata.val();
        let key = FBdata.key;
        if (key == myKey) {
            document.getElementById("inputText").value = data.prompt;
            let localImage = document.getElementById("outputImage");
            localImage.src = data.base64;
            me = data;
            renderOthers();
        } else {
            others[key] = data;
            renderOthers();
        }
    });
    onChildRemoved(commentsRef, (FBdata) => {
        let data = FBdata.val();
        let key = FBdata.key;
        console.log("removed from FB", data, key);

    });
}




function setDataInFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    if (myKey) {
        const dbRef = ref(db, folder + '/' + myKey);
        console.log("updating", myKey);
        update(dbRef, data);
    } else {
        //if it doesn't exist, it adds (pushes) and collect the key for later updates
        const dbRef = ref(db, folder + '/');
        myKey = push(dbRef, data).key;
    }
}

